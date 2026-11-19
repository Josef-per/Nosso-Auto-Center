import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL local: RPC autoriza admin, agrega todo o histórico e preserva dados', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      CREATE TABLE public.perfis(id uuid PRIMARY KEY,papel text);
      CREATE TABLE public.produtos(id bigint PRIMARY KEY,nome text,estoque integer,ativo boolean);
      CREATE TABLE public.pedidos(id uuid PRIMARY KEY,criado_em timestamptz,total numeric,status text,status_pagamento text);
      CREATE TABLE public.pedido_itens(pedido_id uuid,produto_id bigint,nome_produto text,quantidade integer);
      ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
      INSERT INTO public.perfis VALUES ('00000000-0000-0000-0000-000000000001','admin'),('00000000-0000-0000-0000-000000000002','cliente');
    `);
    const adminSql = await readFile(new URL('../supabase/revisao-etapa5/02_administracao.sql', import.meta.url), 'utf8');
    // Executa as próprias funções de autorização do projeto, sem redefinir sua regra.
    await db.exec(adminSql.slice(adminSql.indexOf('CREATE FUNCTION public.usuario_admin()'), adminSql.indexOf('-- Mantém o papel')));
    const migration = await readFile(new URL('../supabase/revisao-etapa8/01_dashboard_admin.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(`SET ROLE anon`);
    await assert.rejects(db.query('SELECT public.admin_dashboard(30)'), (error) => error.code === '42501');
    await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)`);
    await assert.rejects(db.query('SELECT public.admin_dashboard(30)'), (error) => error.code === '42501');
    await assert.rejects(db.query('SELECT * FROM public.pedidos'), (error) => error.code === '42501');
    await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)`);
    const dashboard = async (dias = 30) => (await db.query('SELECT public.admin_dashboard($1::integer) AS dados', [dias])).rows[0].dados;
    let data = await dashboard();
    assert.equal(data.resumo.pedidos, 0);
    assert.equal(data.resumo.ticket_medio, 0);
    assert.equal(data.serie.length, 30);
    assert.ok(data.serie.every((dia) => dia.valor === 0 && dia.quantidade === 0));
    assert.equal(data.status.length, 5); assert.equal(data.estoque.length, 0);
    assert.equal((await dashboard(null)).serie.length, 1);
    await assert.rejects(dashboard(8), (error) => error.code === '22023');
    await db.exec(`RESET ROLE;
      INSERT INTO public.produtos VALUES (1,'Freios',0,true),(2,'Filtro',5,true),(3,'Bateria',6,true),(4,'Inativo',0,false);
      INSERT INTO public.pedidos
        SELECT ('00000000-0000-0000-0001-' || lpad(n::text,12,'0'))::uuid,now(),10,'pendente','simulado' FROM generate_series(1,101) AS n;
      INSERT INTO public.pedidos VALUES
        ('00000000-0000-0000-0002-000000000001',now(),999,'cancelado','simulado'),
        ('00000000-0000-0000-0002-000000000002','2019-01-01 12:00:00+00',200,'entregue',NULL),
        ('00000000-0000-0000-0002-000000000003',((now() AT TIME ZONE 'America/Sao_Paulo')::date::timestamp AT TIME ZONE 'America/Sao_Paulo') - interval '1 minute',20,'confirmado','simulado'),
        ('00000000-0000-0000-0002-000000000004',((now() AT TIME ZONE 'America/Sao_Paulo')::date::timestamp AT TIME ZONE 'America/Sao_Paulo') + interval '1 minute',30,'enviado','simulado');
      INSERT INTO public.pedido_itens VALUES
        ('00000000-0000-0000-0001-000000000001',1,'Nome histórico',2),
        ('00000000-0000-0000-0002-000000000002',1,'Nome antigo',3),
        ('00000000-0000-0000-0002-000000000001',1,'Cancelado',900),
        ('00000000-0000-0000-0001-000000000002',2,'Filtro',1);
      SET ROLE authenticated;
    `);
    data = await dashboard(7);
    assert.equal(data.resumo.pedidos, 105); // não limitado aos 100 recentes
    assert.equal(data.resumo.valor_pedidos, 1260);
    assert.equal(data.resumo.nao_cancelados, 104);
    assert.ok(Math.abs(data.resumo.ticket_medio - 1260 / 104) < 1e-10);
    assert.equal(data.resumo.pendentes, 101); assert.equal(data.resumo.cancelados, 1);
    assert.equal(data.resumo.pagamento_nao_informado, 1);
    assert.equal(data.resumo.produtos_ativos, 3);
    assert.equal(data.resumo.estoque_zerado, 1); assert.equal(data.resumo.estoque_baixo, 1);
    assert.equal(data.serie.length, 7);
    assert.equal(data.serie.reduce((s, p) => s + p.valor, 0), 1060);
    assert.equal(data.serie.at(-2).valor, 20); // 02:59 UTC pertence ao dia anterior em SP
    assert.equal(data.serie.at(-1).valor, 1040);
    assert.equal(data.serie[0].valor, 0);
    assert.deepEqual(data.mais_vendidos[0], { produto_id: 1, nome: 'Freios', quantidade: 5 });
    assert.equal(data.status.reduce((s, p) => s + p.quantidade, 0), 105);
    assert.deepEqual(data.estoque.map((p) => p.id), [1, 2]);
    const complete = await dashboard(null);
    assert.equal(complete.serie.reduce((s, p) => s + p.valor, 0), 1260);
    const equivalent = (await db.query(`RESET ROLE;`));
    assert.ok(equivalent);
    const expected = (await db.query(`SELECT count(*) AS pedidos, sum(total) FILTER (WHERE status IS DISTINCT FROM 'cancelado') AS valor,
      avg(total) FILTER (WHERE status IS DISTINCT FROM 'cancelado') AS ticket FROM public.pedidos`)).rows[0];
    assert.equal(Number(expected.pedidos), data.resumo.pedidos);
    assert.equal(Number(expected.valor), data.resumo.valor_pedidos);
    assert.equal(Number(expected.ticket), data.resumo.ticket_medio);
    assert.doesNotMatch(JSON.stringify(data), /usuario_id|comprador|telefone|endereco|cpf|email/i);
    // Simula uma transição apenas no banco isolado; a RPC recalcula os totais.
    await db.exec(`UPDATE public.pedidos SET status='cancelado' WHERE id='00000000-0000-0000-0001-000000000001'; SET ROLE authenticated`);
    const updated = await dashboard();
    assert.equal(updated.resumo.valor_pedidos, 1250);
    assert.equal(updated.mais_vendidos[0].quantidade, 3);
    assert.equal(updated.resumo.cancelados, 2);
    await db.exec('RESET ROLE');
    const flags = (await db.query(`SELECT relrowsecurity FROM pg_class WHERE oid='public.pedidos'::regclass`)).rows[0];
    assert.equal(flags.relrowsecurity, true);
  } finally { await db.close(); }
});
