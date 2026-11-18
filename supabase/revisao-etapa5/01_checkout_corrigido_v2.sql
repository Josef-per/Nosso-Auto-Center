-- VERSÃO CORRIGIDA: executar somente após inspecionar o esquema com 00_inspecao.sql.
-- Correções: validação de CEP recomposta, trecho duplicado removido e IF de tamanho simplificado.
-- Não recria tabelas anteriores nem altera pedidos antigos.
BEGIN;
DO $$
DECLARE v_col record;
BEGIN
  IF to_regprocedure('public.finalizar_pedido(jsonb)') IS NULL THEN
    RAISE EXCEPTION 'RPC original ausente. Inspecione o esquema antes de continuar.';
  END IF;
  IF (SELECT prorettype FROM pg_proc WHERE oid = 'public.finalizar_pedido(jsonb)'::regprocedure) <> 'uuid'::regtype THEN
    RAISE EXCEPTION 'Retorno da RPC original incompatível';
  END IF;
  FOR v_col IN SELECT * FROM (VALUES
    ('pedidos','id','uuid'), ('pedidos','usuario_id','uuid'), ('pedidos','endereco_entrega','jsonb'),
    ('pedidos','total','numeric'), ('pedidos','status','text'),
    ('carrinho_itens','id','uuid'), ('carrinho_itens','produto_id','bigint'),
    ('carrinho_itens','usuario_id','uuid'), ('carrinho_itens','quantidade','integer'),
    ('pedido_itens','id','uuid'), ('pedido_itens','pedido_id','uuid'), ('pedido_itens','produto_id','bigint'),
    ('pedido_itens','nome_produto','text'), ('pedido_itens','quantidade','integer'),
    ('pedido_itens','preco_unitario','numeric'), ('pedido_itens','subtotal','numeric')
  ) AS t(tabela,coluna,tipo) LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
      AND table_name = v_col.tabela AND column_name = v_col.coluna AND data_type = v_col.tipo) THEN
      RAISE EXCEPTION 'Coluna incompatível: %.%', v_col.tabela, v_col.coluna;
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pedidos'
    AND column_name IN ('frete','subtotal_produtos','metodo_pagamento','status_pagamento')) THEN
    RAISE EXCEPTION 'Colunas da etapa 5 já existem. Não reaplique: revise a migração parcial ou anterior.';
  END IF;
END $$;

ALTER TABLE public.pedidos
  ADD COLUMN frete numeric(12,2) CHECK (frete >= 0),
  ADD COLUMN subtotal_produtos numeric(12,2) CHECK (subtotal_produtos >= 0),
  ADD COLUMN metodo_pagamento text CHECK (metodo_pagamento IN ('pix','boleto','cartao_credito')),
  ADD COLUMN status_pagamento text CHECK (status_pagamento = 'simulado'),
  ADD CONSTRAINT pedido_demonstrativo_completo CHECK (
    (frete IS NULL AND subtotal_produtos IS NULL AND metodo_pagamento IS NULL AND status_pagamento IS NULL)
    OR (frete IS NOT NULL AND subtotal_produtos IS NOT NULL AND metodo_pagamento IS NOT NULL
      AND status_pagamento IS NOT NULL AND status_pagamento = 'simulado' AND total = subtotal_produtos + frete)
  );
COMMENT ON COLUMN public.pedidos.frete IS 'Frete acadêmico; NULL em pedidos anteriores à etapa 5.';
COMMENT ON COLUMN public.pedidos.status_pagamento IS 'Simulado, sem processamento financeiro. NULL em pedidos antigos.';

CREATE FUNCTION public.calcular_frete_demonstrativo(p_cep text) RETURNS numeric
LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE v_prefixo integer;
BEGIN
  IF p_cep IS NULL OR p_cep !~ '^[0-9]{8}$' THEN
    RAISE EXCEPTION 'CEP deve conter oito dígitos em faixa válida' USING ERRCODE = '22023';
  END IF;
  IF p_cep::bigint < 1000000 THEN RAISE EXCEPTION 'CEP fora da faixa valida' USING ERRCODE = '22023'; END IF;
  v_prefixo := left(p_cep,5)::integer;
  RETURN CASE WHEN v_prefixo <= 19999 THEN 15.00 WHEN v_prefixo <= 39999 THEN 25.00 ELSE 39.90 END;
END $$;
REVOKE ALL ON FUNCTION public.calcular_frete_demonstrativo(text) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.cpf_digitos_validos(p_cpf text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE tamanho integer; i integer; soma integer; digito integer;
BEGIN
  IF p_cpf IS NULL OR p_cpf !~ '^[0-9]{11}$' OR p_cpf = repeat(left(p_cpf,1),11) THEN RETURN false; END IF;
  FOR tamanho IN 9..10 LOOP
    soma := 0;
    FOR i IN 1..tamanho LOOP soma := soma + substr(p_cpf,i,1)::integer * (tamanho + 2 - i); END LOOP;
    digito := (soma * 10) % 11;
    IF digito = 10 THEN digito := 0; END IF;
    IF digito <> substr(p_cpf,tamanho+1,1)::integer THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.cpf_digitos_validos(text) FROM PUBLIC, anon, authenticated;

-- Nova assinatura sem valores financeiros vindos do navegador.
CREATE FUNCTION public.finalizar_pedido(p_endereco_entrega jsonb, p_metodo_pagamento text, p_cpf text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_usuario uuid := auth.uid(); v_pedido uuid; v_subtotal numeric(12,2) := 0;
  v_frete numeric(12,2); v_cep text; v_endereco jsonb; v_item record;
  v_ids uuid[] := ARRAY[]::uuid[]; v_campo text;
BEGIN
  IF v_usuario IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '42501'; END IF;
  IF NOT public.cpf_digitos_validos(p_cpf) THEN RAISE EXCEPTION 'CPF invalido' USING ERRCODE = '22023'; END IF;
  IF p_metodo_pagamento IS NULL OR p_metodo_pagamento NOT IN ('pix','boleto','cartao_credito') THEN
    RAISE EXCEPTION 'Metodo de pagamento demonstrativo invalido' USING ERRCODE = '22023';
  END IF;
  IF p_endereco_entrega IS NULL OR jsonb_typeof(p_endereco_entrega) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Endereco invalido' USING ERRCODE = '22023';
  END IF;
  FOREACH v_campo IN ARRAY ARRAY['cep','logradouro','numero','cidade','uf'] LOOP
    IF coalesce(btrim(p_endereco_entrega->>v_campo),'') = '' THEN
      RAISE EXCEPTION 'Endereco incompleto: %', v_campo USING ERRCODE = '22023';
    END IF;
  END LOOP;
  FOREACH v_campo IN ARRAY ARRAY['logradouro','numero','cidade','bairro','complemento'] LOOP
    IF (v_campo = 'numero' AND length(p_endereco_entrega->>v_campo) > 30)
       OR (v_campo <> 'numero' AND length(p_endereco_entrega->>v_campo) > 200) THEN
      RAISE EXCEPTION 'Endereco excede tamanho permitido' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  IF (p_endereco_entrega->>'uf') NOT IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') THEN
    RAISE EXCEPTION 'UF do endereco invalida' USING ERRCODE = '22023';
  END IF;
  v_cep := p_endereco_entrega->>'cep';
  v_frete := public.calcular_frete_demonstrativo(v_cep);
  -- Lista explícita de campos: CPF e extras nunca entram no endereço persistido.
  v_endereco := jsonb_build_object('cep',v_cep,'logradouro',btrim(p_endereco_entrega->>'logradouro'),
    'numero',btrim(p_endereco_entrega->>'numero'),'cidade',btrim(p_endereco_entrega->>'cidade'),
    'uf',p_endereco_entrega->>'uf','bairro',btrim(coalesce(p_endereco_entrega->>'bairro','')),
    'complemento',btrim(coalesce(p_endereco_entrega->>'complemento','')));
  -- Serializa checkouts simultâneos da mesma conta. Produtos são bloqueados em ordem estável.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_usuario::text,0));
  INSERT INTO public.pedidos(usuario_id,total,endereco_entrega)
    VALUES (v_usuario,0,v_endereco) RETURNING id INTO v_pedido;
  FOR v_item IN SELECT ci.id, ci.produto_id, ci.quantidade, p.nome, p.preco, p.estoque, p.ativo
    FROM public.carrinho_itens ci JOIN public.produtos p ON p.id = ci.produto_id
    WHERE ci.usuario_id = v_usuario ORDER BY ci.produto_id FOR UPDATE OF ci,p LOOP
    IF v_item.ativo IS DISTINCT FROM true THEN RAISE EXCEPTION 'Produto indisponivel: %',v_item.nome; END IF;
    IF v_item.quantidade NOT BETWEEN 1 AND 99 THEN RAISE EXCEPTION 'Quantidade invalida'; END IF;
    IF v_item.estoque < v_item.quantidade THEN RAISE EXCEPTION 'Estoque insuficiente: %',v_item.nome; END IF;
    INSERT INTO public.pedido_itens(pedido_id,produto_id,nome_produto,quantidade,preco_unitario)
      VALUES(v_pedido,v_item.produto_id,v_item.nome,v_item.quantidade,v_item.preco);
    UPDATE public.produtos SET estoque = estoque - v_item.quantidade WHERE id = v_item.produto_id;
    v_subtotal := v_subtotal + v_item.preco * v_item.quantidade;
    v_ids := array_append(v_ids,v_item.id);
  END LOOP;
  IF cardinality(v_ids) = 0 THEN RAISE EXCEPTION 'Carrinho vazio'; END IF;
  UPDATE public.pedidos SET subtotal_produtos = v_subtotal, frete = v_frete, total = v_subtotal + v_frete,
    metodo_pagamento = p_metodo_pagamento, status_pagamento = 'simulado' WHERE id = v_pedido;
  -- Não apaga itens novos que possam ter sido adicionados durante a transação.
  DELETE FROM public.carrinho_itens WHERE usuario_id = v_usuario AND id = ANY(v_ids);
  RETURN v_pedido;
END $$;
-- A assinatura antiga fica preservada para inspeção, mas não permite contornar o frete.
REVOKE ALL ON FUNCTION public.finalizar_pedido(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalizar_pedido(jsonb,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalizar_pedido(jsonb,text,text) TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.pedidos, public.pedido_itens FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.checkout_etapa5_disponivel() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$ SELECT auth.uid() IS NOT NULL $$;
REVOKE ALL ON FUNCTION public.checkout_etapa5_disponivel() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_etapa5_disponivel() TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
