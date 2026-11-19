-- Etapa 7G. Revisar e aplicar MANUALMENTE após administração (5) e entrega (6).
-- Somente uma função agregadora: não altera tabelas, pedidos, usuários ou RLS.
BEGIN;
DO $$
DECLARE v_col record;
BEGIN
  IF to_regprocedure('public.exigir_admin()') IS NULL THEN
    RAISE EXCEPTION 'Aplique e revise a administração da etapa 5 primeiro';
  END IF;
  FOR v_col IN SELECT * FROM (VALUES
    ('pedidos','id','uuid'), ('pedidos','criado_em','timestamp with time zone'),
    ('pedidos','total','numeric'), ('pedidos','status','text'), ('pedidos','status_pagamento','text'),
    ('pedido_itens','pedido_id','uuid'), ('pedido_itens','produto_id','bigint'),
    ('pedido_itens','nome_produto','text'), ('pedido_itens','quantidade','integer'),
    ('produtos','id','bigint'), ('produtos','nome','text'), ('produtos','estoque','integer'), ('produtos','ativo','boolean')
  ) AS t(tabela,coluna,tipo) LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
      AND table_name = v_col.tabela AND column_name = v_col.coluna AND data_type = v_col.tipo) THEN
      RAISE EXCEPTION 'Coluna ausente ou incompatível: %.%', v_col.tabela, v_col.coluna;
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.admin_dashboard(p_dias integer DEFAULT 30) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_inicio date; v_fim date; v_resultado jsonb;
BEGIN
  PERFORM public.exigir_admin();
  IF p_dias IS NOT NULL AND p_dias NOT IN (7,30) THEN
    RAISE EXCEPTION 'Selecione 7, 30 dias ou período completo' USING ERRCODE = '22023';
  END IF;
  v_fim := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  IF p_dias IS NULL THEN
    SELECT coalesce(min((criado_em AT TIME ZONE 'America/Sao_Paulo')::date),v_fim),
      greatest(v_fim,max((criado_em AT TIME ZONE 'America/Sao_Paulo')::date))
      INTO v_inicio,v_fim FROM public.pedidos;
  ELSE
    v_inicio := v_fim - (p_dias - 1);
  END IF;

  WITH resumo AS (
    SELECT count(*) AS pedidos,
      count(*) FILTER (WHERE status IS DISTINCT FROM 'cancelado') AS nao_cancelados,
      coalesce(sum(coalesce(total,0)) FILTER (WHERE status IS DISTINCT FROM 'cancelado'),0) AS valor_pedidos,
      coalesce(avg(coalesce(total,0)) FILTER (WHERE status IS DISTINCT FROM 'cancelado'),0) AS ticket_medio,
      count(*) FILTER (WHERE status = 'pendente') AS pendentes,
      count(*) FILTER (WHERE status = 'cancelado') AS cancelados,
      count(*) FILTER (WHERE status_pagamento IS DISTINCT FROM 'simulado') AS pagamento_nao_informado
    FROM public.pedidos
  ), estoque AS (
    SELECT count(*) FILTER (WHERE ativo) AS produtos_ativos,
      count(*) FILTER (WHERE ativo AND estoque = 0) AS estoque_zerado,
      count(*) FILTER (WHERE ativo AND estoque BETWEEN 1 AND 5) AS estoque_baixo
    FROM public.produtos
  ), dias AS (
    SELECT v_inicio + n AS dia FROM pg_catalog.generate_series(0,v_fim - v_inicio) AS n
  ), movimentos AS (
    SELECT (criado_em AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
      sum(coalesce(total,0)) AS valor, count(*) AS quantidade
    FROM public.pedidos
    WHERE status IS DISTINCT FROM 'cancelado'
      AND criado_em >= (v_inicio::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND criado_em < ((v_fim + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
    GROUP BY 1
  ), distribuicao AS (
    SELECT s.status, count(p.id) AS quantidade FROM
      (VALUES ('pendente',1),('confirmado',2),('enviado',3),('entregue',4),('cancelado',5)) AS s(status,ordem)
      LEFT JOIN public.pedidos p ON p.status = s.status
    GROUP BY s.status,s.ordem ORDER BY s.ordem
  ), vendidos AS (
    SELECT i.produto_id, coalesce(pr.nome,max(i.nome_produto),'Produto indisponível') AS nome,
      sum(coalesce(i.quantidade,0)) AS quantidade
    FROM public.pedido_itens i JOIN public.pedidos pe ON pe.id = i.pedido_id
      LEFT JOIN public.produtos pr ON pr.id = i.produto_id
    WHERE pe.status IS DISTINCT FROM 'cancelado'
    GROUP BY i.produto_id,pr.nome,CASE WHEN i.produto_id IS NULL THEN i.nome_produto END
    ORDER BY quantidade DESC,nome,i.produto_id LIMIT 5
  ), alertas AS (
    SELECT id,nome,estoque FROM public.produtos WHERE ativo AND estoque <= 5
    ORDER BY estoque,nome,id LIMIT 12
  )
  SELECT jsonb_build_object(
    'gerado_em',now(), 'inicio',v_inicio,'fim',v_fim,
    'resumo',(SELECT to_jsonb(r) || to_jsonb(e) FROM resumo r CROSS JOIN estoque e),
    'serie',(SELECT jsonb_agg(jsonb_build_object('dia',d.dia,'valor',coalesce(m.valor,0),
      'quantidade',coalesce(m.quantidade,0)) ORDER BY d.dia) FROM dias d LEFT JOIN movimentos m USING(dia)),
    'status',(SELECT jsonb_agg(to_jsonb(s)) FROM distribuicao s),
    'mais_vendidos',(SELECT coalesce(jsonb_agg(to_jsonb(v)),'[]'::jsonb) FROM vendidos v),
    'estoque',(SELECT coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) FROM alertas a)
  ) INTO v_resultado;
  RETURN v_resultado;
END $$;

REVOKE ALL ON FUNCTION public.admin_dashboard(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard(integer) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
