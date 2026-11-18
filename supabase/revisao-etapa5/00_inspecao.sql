-- Somente leitura. Compare o resultado com as definições enviadas antes de aplicar 01 e 02.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_schema = 'public'
AND table_name IN ('perfis','produtos','categorias','carrinho_itens','pedidos','pedido_itens')
ORDER BY table_name, ordinal_position;
SELECT c.relname AS tabela, pg_get_constraintdef(k.oid) AS restricao
FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid
WHERE k.conrelid IN ('public.pedidos'::regclass,'public.pedido_itens'::regclass,'public.carrinho_itens'::regclass);
SELECT pg_get_functiondef('public.finalizar_pedido(jsonb)'::regprocedure);
SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';
SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated') ORDER BY table_name, grantee;
SELECT column_name, grantee, privilege_type FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'perfis' AND grantee IN ('anon','authenticated');
