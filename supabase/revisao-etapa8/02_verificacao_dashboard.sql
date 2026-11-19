-- SOMENTE LEITURA. Executar manualmente com acesso de manutenção autorizado.
-- Compare com os cards (todo o histórico), não com os 100 pedidos recentes.
SELECT count(*) AS pedidos,
  count(*) FILTER (WHERE status IS DISTINCT FROM 'cancelado') AS nao_cancelados,
  coalesce(sum(coalesce(total,0)) FILTER (WHERE status IS DISTINCT FROM 'cancelado'),0) AS valor_pedidos,
  coalesce(avg(coalesce(total,0)) FILTER (WHERE status IS DISTINCT FROM 'cancelado'),0) AS ticket_medio,
  count(*) FILTER (WHERE status = 'pendente') AS pendentes,
  count(*) FILTER (WHERE status = 'cancelado') AS cancelados,
  count(*) FILTER (WHERE status_pagamento IS DISTINCT FROM 'simulado') AS pagamento_nao_informado
FROM public.pedidos;

SELECT count(*) FILTER (WHERE ativo) AS produtos_ativos,
  count(*) FILTER (WHERE ativo AND estoque = 0) AS estoque_zerado,
  count(*) FILTER (WHERE ativo AND estoque BETWEEN 1 AND 5) AS estoque_baixo
FROM public.produtos;

SELECT status,count(*) AS quantidade FROM public.pedidos GROUP BY status ORDER BY status;

-- Série equivalente de 7 dias, inclusive dias sem pedidos.
WITH limites AS (
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS fim
), dias AS (
  SELECT fim - n AS dia FROM limites CROSS JOIN generate_series(0,6) n
)
SELECT d.dia,count(p.id) AS quantidade,coalesce(sum(coalesce(p.total,0)),0) AS valor
FROM dias d LEFT JOIN public.pedidos p
  ON (p.criado_em AT TIME ZONE 'America/Sao_Paulo')::date = d.dia
  AND p.status IS DISTINCT FROM 'cancelado'
GROUP BY d.dia ORDER BY d.dia;

SELECT i.produto_id,coalesce(pr.nome,max(i.nome_produto),'Produto indisponível') AS nome,
  sum(coalesce(i.quantidade,0)) AS quantidade
FROM public.pedido_itens i JOIN public.pedidos pe ON pe.id = i.pedido_id
LEFT JOIN public.produtos pr ON pr.id = i.produto_id
WHERE pe.status IS DISTINCT FROM 'cancelado'
GROUP BY i.produto_id,pr.nome,CASE WHEN i.produto_id IS NULL THEN i.nome_produto END
ORDER BY quantidade DESC,nome,i.produto_id LIMIT 5;

-- Metadados e privilégios; não amplia permissões.
SELECT p.proname,p.prosecdef,p.proconfig,p.proacl
FROM pg_proc p WHERE p.oid = 'public.admin_dashboard(integer)'::regprocedure;
SELECT has_function_privilege('anon','public.admin_dashboard(integer)','EXECUTE') AS anon_executa,
  has_function_privilege('authenticated','public.admin_dashboard(integer)','EXECUTE') AS autenticado_executa;
-- Esperado: false / true. A RPC ainda exige exigir_admin() internamente.
