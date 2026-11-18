-- Aplicar após 01_checkout.sql. Revisar permissões e regras antes de executar.
BEGIN;
DO $$ BEGIN
  IF to_regprocedure('public.finalizar_pedido(jsonb,text,text)') IS NULL THEN RAISE EXCEPTION 'Aplique 01_checkout.sql primeiro'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'perfis' AND column_name = 'papel' AND data_type = 'text') THEN
    RAISE EXCEPTION 'Campo perfis.papel incompatível';
  END IF;
END $$;

CREATE FUNCTION public.usuario_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.perfis WHERE id = auth.uid() AND papel = 'admin')
$$;
REVOKE ALL ON FUNCTION public.usuario_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_admin() TO authenticated;

CREATE FUNCTION public.exigir_admin() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.usuario_admin() THEN RAISE EXCEPTION 'Acesso administrativo nao autorizado' USING ERRCODE = '42501'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.exigir_admin() FROM PUBLIC, anon, authenticated;

-- Mantém o papel fora das colunas editáveis. Sem promoção de usuário pela aplicação.
REVOKE INSERT, UPDATE, DELETE ON public.perfis FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (id, papel, criado_em) ON public.perfis FROM PUBLIC, anon, authenticated;
GRANT UPDATE (nome, telefone) ON public.perfis TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.produtos, public.categorias FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.admin_resumo() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.exigir_admin();
  RETURN jsonb_build_object('produtos_ativos',(SELECT count(*) FROM public.produtos WHERE ativo),
    'sem_estoque',(SELECT count(*) FROM public.produtos WHERE ativo AND estoque = 0),
    'pedidos',(SELECT count(*) FROM public.pedidos));
END $$;
CREATE FUNCTION public.admin_listar_produtos() RETURNS SETOF public.produtos
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.exigir_admin();
  RETURN QUERY SELECT * FROM public.produtos ORDER BY id;
END $$;
CREATE FUNCTION public.admin_salvar_produto(p_produto jsonb) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id bigint; v_preco numeric; v_antigo numeric; v_estoque numeric; v_categoria bigint; v_imagem text;
BEGIN
  PERFORM public.exigir_admin();
  IF p_produto IS NULL OR jsonb_typeof(p_produto) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Dados de produto invalidos' USING ERRCODE = '22023';
  END IF;
  IF coalesce(btrim(p_produto->>'nome'),'') = '' OR length(p_produto->>'nome') > 200
    OR coalesce(p_produto->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(p_produto->>'slug') > 150
    OR length(p_produto->>'marca') > 100 OR length(p_produto->>'descricao') > 10000 OR length(p_produto->>'selo') > 50 THEN
    RAISE EXCEPTION 'Confira nome, slug e tamanho dos campos do produto' USING ERRCODE = '22023';
  END IF;
  v_preco := (p_produto->>'preco')::numeric;
  v_antigo := nullif(p_produto->>'preco_antigo','')::numeric;
  v_estoque := (p_produto->>'estoque')::numeric;
  v_categoria := (p_produto->>'categoria_id')::bigint;
  IF v_preco IS NULL OR v_preco < 0 OR v_preco > 99999999.99 OR v_preco <> round(v_preco,2)
    OR (v_antigo IS NOT NULL AND (v_antigo < 0 OR v_antigo > 99999999.99 OR v_antigo <> round(v_antigo,2)))
    OR v_estoque IS NULL OR v_estoque < 0 OR v_estoque > 2147483647 OR v_estoque <> trunc(v_estoque)
    OR v_preco::text IN ('NaN','Infinity','-Infinity') OR v_antigo::text IN ('NaN','Infinity','-Infinity')
    OR v_estoque::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'Preco ou estoque invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.categorias WHERE id = v_categoria) THEN
    RAISE EXCEPTION 'Categoria inexistente' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_produto->'ativo') IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'Informe se o produto esta ativo' USING ERRCODE = '22023';
  END IF;
  v_imagem := nullif(btrim(p_produto->>'imagem_url'),'');
  IF v_imagem IS NOT NULL AND (length(v_imagem) > 2000 OR v_imagem !~ '^(https://[^[:space:]]+|/images/[^[:space:]]+)$') THEN
    RAISE EXCEPTION 'Use uma URL HTTPS ou um caminho em /images/ para a imagem' USING ERRCODE = '22023';
  END IF;
  v_id := nullif(p_produto->>'id','')::bigint;
  IF v_id IS NULL THEN
    INSERT INTO public.produtos(nome,slug,categoria_id,marca,descricao,preco,preco_antigo,estoque,imagem_url,selo,ativo)
    VALUES(btrim(p_produto->>'nome'),p_produto->>'slug',v_categoria,nullif(btrim(p_produto->>'marca'),''),
      p_produto->>'descricao',v_preco,v_antigo,v_estoque::integer,v_imagem,nullif(btrim(p_produto->>'selo'),''),(p_produto->>'ativo')::boolean)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.produtos SET nome = btrim(p_produto->>'nome'), slug = p_produto->>'slug', categoria_id = v_categoria,
      marca = nullif(btrim(p_produto->>'marca'),''), descricao = p_produto->>'descricao', preco = v_preco,
      preco_antigo = v_antigo, estoque = v_estoque::integer, imagem_url = v_imagem,
      selo = nullif(btrim(p_produto->>'selo'),''), ativo = (p_produto->>'ativo')::boolean WHERE id = v_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto nao encontrado' USING ERRCODE = '22023'; END IF;
  END IF;
  RETURN v_id;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
  RAISE EXCEPTION 'Confira os campos numericos do produto' USING ERRCODE = '22023';
END $$;
CREATE FUNCTION public.admin_desativar_produto(p_id bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.exigir_admin();
  UPDATE public.produtos SET ativo = false WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto nao encontrado' USING ERRCODE = '22023'; END IF;
END $$;
CREATE FUNCTION public.admin_listar_pedidos() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE resultado jsonb;
BEGIN
  PERFORM public.exigir_admin();
  SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.criado_em DESC),'[]'::jsonb) INTO resultado FROM (
    SELECT id,criado_em,total,status,frete,subtotal_produtos,metodo_pagamento,status_pagamento,
      (SELECT coalesce(jsonb_agg(jsonb_build_object('id',i.id,'nome_produto',i.nome_produto,
        'quantidade',i.quantidade,'subtotal',i.subtotal) ORDER BY i.id),'[]'::jsonb)
        FROM public.pedido_itens i WHERE i.pedido_id = pedidos.id) AS itens
    FROM public.pedidos ORDER BY criado_em DESC LIMIT 100
  ) p;
  RETURN resultado;
END $$;

CREATE TABLE public.pedido_status_auditoria (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id),
  administrador_id uuid NOT NULL REFERENCES public.perfis(id),
  status_anterior text NOT NULL, status_novo text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pedido_status_auditoria ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pedido_status_auditoria FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.admin_atualizar_status(p_id uuid, p_status text, p_status_atual text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_status text; v_item record;
BEGIN
  PERFORM public.exigir_admin();
  SELECT status INTO v_status FROM public.pedidos WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido nao encontrado' USING ERRCODE = '22023'; END IF;
  IF v_status IS DISTINCT FROM p_status_atual THEN
    RAISE EXCEPTION 'O pedido mudou. Recarregue os dados antes de continuar.' USING ERRCODE = '22023';
  END IF;
  IF p_status IS NULL OR NOT (
    (v_status = 'pendente' AND p_status IN ('confirmado','cancelado')) OR
    (v_status = 'confirmado' AND p_status IN ('enviado','cancelado')) OR
    (v_status = 'enviado' AND p_status = 'entregue')
  ) THEN RAISE EXCEPTION 'Transicao de status nao permitida' USING ERRCODE = '22023'; END IF;
  IF p_status = 'cancelado' THEN
    FOR v_item IN SELECT p.id, sum(i.quantidade)::integer AS unidades FROM public.pedido_itens i
      JOIN public.produtos p ON p.id = i.produto_id WHERE i.pedido_id = p_id GROUP BY p.id ORDER BY p.id LOOP
      UPDATE public.produtos SET estoque = estoque + v_item.unidades WHERE id = v_item.id;
    END LOOP;
  END IF;
  UPDATE public.pedidos SET status = p_status WHERE id = p_id;
  INSERT INTO public.pedido_status_auditoria(pedido_id,administrador_id,status_anterior,status_novo)
    VALUES(p_id,auth.uid(),v_status,p_status);
  -- Não altera status_pagamento e não aprova/captura pagamentos.
END $$;

REVOKE ALL ON FUNCTION public.admin_resumo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_listar_produtos() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_salvar_produto(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_desativar_produto(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_listar_pedidos() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_atualizar_status(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resumo(), public.admin_listar_produtos(), public.admin_salvar_produto(jsonb),
  public.admin_desativar_produto(bigint), public.admin_listar_pedidos(), public.admin_atualizar_status(uuid,text,text) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
