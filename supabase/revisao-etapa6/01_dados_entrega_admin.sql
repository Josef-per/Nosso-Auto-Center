-- ETAPA 6. Somente aplicação MANUAL após revisar o esquema atual.
-- Pré-requisitos: checkout e administração da etapa 5 já aplicados.
-- Antes de aplicar, salve o resultado destas consultas no SQL Editor:
-- SELECT pg_get_functiondef('public.admin_listar_pedidos()'::regprocedure);
-- SELECT pg_get_functiondef('public.exigir_admin()'::regprocedure);
-- SELECT pg_get_functiondef('public.usuario_admin()'::regprocedure);
BEGIN;
DO $$
BEGIN
  IF to_regprocedure('public.admin_listar_pedidos()') IS NULL
    OR to_regprocedure('public.exigir_admin()') IS NULL
    OR to_regprocedure('public.usuario_admin()') IS NULL THEN
    RAISE EXCEPTION 'Funcoes administrativas da etapa 5 ausentes. Revise o esquema.';
  END IF;
  IF (SELECT prorettype FROM pg_proc WHERE oid = 'public.admin_listar_pedidos()'::regprocedure) <> 'jsonb'::regtype THEN
    RAISE EXCEPTION 'Retorno da RPC administrativa incompatível';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
    AND table_name = 'pedidos' AND column_name = 'endereco_entrega' AND data_type = 'jsonb') THEN
    RAISE EXCEPTION 'Endereco de entrega ausente ou incompatível';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_listar_pedidos() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE resultado jsonb;
BEGIN
  -- A autorização acontece em toda chamada, inclusive fora do React.
  PERFORM public.exigir_admin();
  SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.criado_em DESC,p.id DESC),'[]'::jsonb) INTO resultado FROM (
    SELECT pe.id,pe.criado_em,pe.total,pe.status,pe.frete,pe.subtotal_produtos,pe.metodo_pagamento,pe.status_pagamento,
      jsonb_build_object(
        'comprador',pf.nome,
        'telefone',pf.telefone,
        'endereco',CASE WHEN jsonb_typeof(pe.endereco_entrega) = 'object' THEN
          jsonb_build_object('cep',pe.endereco_entrega->>'cep','logradouro',pe.endereco_entrega->>'logradouro',
            'numero',pe.endereco_entrega->>'numero','complemento',pe.endereco_entrega->>'complemento',
            'bairro',pe.endereco_entrega->>'bairro','cidade',pe.endereco_entrega->>'cidade','uf',pe.endereco_entrega->>'uf')
          ELSE NULL END
      ) AS entrega,
      (SELECT coalesce(jsonb_agg(jsonb_build_object('id',i.id,'nome_produto',i.nome_produto,
        'quantidade',i.quantidade,'subtotal',i.subtotal) ORDER BY i.id),'[]'::jsonb)
        FROM public.pedido_itens i WHERE i.pedido_id = pe.id) AS itens
    FROM public.pedidos pe LEFT JOIN public.perfis pf ON pf.id = pe.usuario_id
    ORDER BY pe.criado_em DESC,pe.id DESC LIMIT 100
  ) p;
  RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.admin_listar_pedidos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_listar_pedidos() TO authenticated;
-- Nenhum grant de leitura direta de perfis/pedidos foi ampliado.
NOTIFY pgrst, 'reload schema';
COMMIT;
