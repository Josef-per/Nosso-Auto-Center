-- ETAPA 7C — aplicar MANUALMENTE primeiro em ambiente de validação.
-- Independente de checkout, pedidos e estoque. Não contém avaliações de exemplo.
BEGIN;

CREATE TABLE public.avaliacoes_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id bigint NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nota smallint NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario text CHECK (comentario IS NULL OR char_length(comentario) <= 1000),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uma_avaliacao_por_produto_usuario UNIQUE (produto_id, usuario_id)
);
CREATE INDEX avaliacoes_produtos_usuario_idx ON public.avaliacoes_produtos(usuario_id);
CREATE INDEX avaliacoes_produtos_pagina_idx ON public.avaliacoes_produtos(produto_id, criado_em DESC, id DESC);

ALTER TABLE public.avaliacoes_produtos ENABLE ROW LEVEL SECURITY;

-- Leitura direta só da própria avaliação. Leitura pública usa a RPC sanitizada.
CREATE POLICY avaliacoes_ler_propria ON public.avaliacoes_produtos
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = usuario_id);
CREATE POLICY avaliacoes_inserir_propria ON public.avaliacoes_produtos
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT auth.uid()) = usuario_id AND EXISTS (
      SELECT 1 FROM public.produtos p WHERE p.id = produto_id AND p.ativo
    )
  );
CREATE POLICY avaliacoes_editar_propria ON public.avaliacoes_produtos
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = usuario_id)
  WITH CHECK ((SELECT auth.uid()) = usuario_id AND EXISTS (
    SELECT 1 FROM public.produtos p WHERE p.id = produto_id AND p.ativo
  ));
CREATE POLICY avaliacoes_excluir_propria ON public.avaliacoes_produtos
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = usuario_id);

-- Defesa adicional: IDs e datas não podem ser escolhidos ou alterados pelo cliente.
REVOKE ALL ON public.avaliacoes_produtos FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.avaliacoes_produtos TO authenticated;
GRANT INSERT (produto_id, nota, comentario) ON public.avaliacoes_produtos TO authenticated;
GRANT UPDATE (nota, comentario) ON public.avaliacoes_produtos TO authenticated;

CREATE FUNCTION public.proteger_autoria_avaliacao() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.produto_id IS DISTINCT FROM OLD.produto_id
    OR NEW.usuario_id IS DISTINCT FROM OLD.usuario_id
    OR NEW.criado_em IS DISTINCT FROM OLD.criado_em THEN
    RAISE EXCEPTION 'Identificadores e autoria da avaliação são imutáveis.' USING ERRCODE = '42501';
  END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.proteger_autoria_avaliacao() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER avaliacoes_autoria_imutavel BEFORE UPDATE ON public.avaliacoes_produtos
FOR EACH ROW EXECUTE FUNCTION public.proteger_autoria_avaliacao();

-- SECURITY DEFINER é necessário para agregar avaliações alheias, mas a resposta
-- é uma projeção fixa: não lê auth.users/perfis nem retorna usuario_id.
CREATE FUNCTION public.consultar_avaliacoes(p_produto_id bigint, p_pagina integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE resultado jsonb;
BEGIN
  IF p_produto_id IS NULL OR p_produto_id < 1 OR p_pagina IS NULL OR p_pagina < 0 OR p_pagina > 100000 THEN
    RAISE EXCEPTION 'Produto ou página inválidos.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = p_produto_id AND p.ativo) THEN
    RETURN jsonb_build_object('total', 0, 'media', NULL, 'comentarios', '[]'::jsonb);
  END IF;
  SELECT jsonb_build_object('total', count(*), 'media', round(avg(a.nota), 1))
    INTO resultado FROM public.avaliacoes_produtos a WHERE a.produto_id = p_produto_id;
  RETURN resultado || jsonb_build_object('comentarios', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', pagina.id, 'nota', pagina.nota, 'comentario', pagina.comentario,
      'criado_em', pagina.criado_em, 'atualizado_em', pagina.atualizado_em
    ) ORDER BY pagina.criado_em DESC, pagina.id DESC), '[]'::jsonb)
    FROM (
      SELECT a.id, a.nota, a.comentario, a.criado_em, a.atualizado_em
      FROM public.avaliacoes_produtos a WHERE a.produto_id = p_produto_id
      ORDER BY a.criado_em DESC, a.id DESC LIMIT 8 OFFSET p_pagina * 8
    ) pagina
  ));
END;
$$;
REVOKE ALL ON FUNCTION public.consultar_avaliacoes(bigint, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consultar_avaliacoes(bigint, integer) TO anon, authenticated;
COMMENT ON TABLE public.avaliacoes_produtos IS 'Avaliações reais, uma por cliente/produto. Autoria privada e imutável.';
COMMENT ON FUNCTION public.consultar_avaliacoes(bigint, integer) IS 'Resumo real e página de 8 avaliações; sem dados privados de autoria.';
NOTIFY pgrst, 'reload schema';

COMMIT;
