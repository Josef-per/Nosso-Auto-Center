-- Etapa 7E: aplicar manualmente APÓS revisao-etapa5/02_administracao.sql.
-- Não modifica produtos, perfis, funções administrativas nem objetos existentes.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.usuario_admin()') IS NULL THEN
    RAISE EXCEPTION 'Aplique a administração da etapa 5 antes do Storage de produtos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'objects' AND c.relrowsecurity) THEN
    RAISE EXCEPTION 'Storage indisponível ou RLS de storage.objects desativada';
  END IF;
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'produtos' AND NOT public) THEN
    RAISE EXCEPTION 'O bucket produtos já é privado. Revise os arquivos antes de torná-lo público';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('produtos', 'produtos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- As imagens do bucket público já podem ser acessadas pela URL.
-- Não precisamos liberar a listagem pública de objetos.
DROP POLICY IF EXISTS produtos_leitura_publica ON storage.objects;

DROP POLICY IF EXISTS produtos_envio_admin ON storage.objects;
CREATE POLICY produtos_envio_admin ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'produtos' AND (SELECT public.usuario_admin()));

DROP POLICY IF EXISTS produtos_edicao_admin ON storage.objects;
CREATE POLICY produtos_edicao_admin ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'produtos' AND (SELECT public.usuario_admin()))
  WITH CHECK (bucket_id = 'produtos' AND (SELECT public.usuario_admin()));

DROP POLICY IF EXISTS produtos_exclusao_admin ON storage.objects;
CREATE POLICY produtos_exclusao_admin ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'produtos' AND (SELECT public.usuario_admin()));

-- As políticas permissivas são combinadas com OR. Estas guardas restritivas
-- impedem que políticas antigas mais amplas autorizem clientes neste bucket.
-- CASE evita chamar usuario_admin() como anon (sem privilégio EXECUTE).
DROP POLICY IF EXISTS produtos_guard_insert ON storage.objects;
CREATE POLICY produtos_guard_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (CASE WHEN bucket_id = 'produtos' THEN
    CASE WHEN (SELECT auth.role()) = 'authenticated' THEN (SELECT public.usuario_admin()) ELSE false END
    ELSE true END);

DROP POLICY IF EXISTS produtos_guard_update ON storage.objects;
CREATE POLICY produtos_guard_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO public
  USING (CASE WHEN bucket_id = 'produtos' THEN
    CASE WHEN (SELECT auth.role()) = 'authenticated' THEN (SELECT public.usuario_admin()) ELSE false END
    ELSE true END)
  WITH CHECK (CASE WHEN bucket_id = 'produtos' THEN
    CASE WHEN (SELECT auth.role()) = 'authenticated' THEN (SELECT public.usuario_admin()) ELSE false END
    ELSE true END);

DROP POLICY IF EXISTS produtos_guard_delete ON storage.objects;
CREATE POLICY produtos_guard_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO public
  USING (CASE WHEN bucket_id = 'produtos' THEN
    CASE WHEN (SELECT auth.role()) = 'authenticated' THEN (SELECT public.usuario_admin()) ELSE false END
    ELSE true END);

COMMIT;
