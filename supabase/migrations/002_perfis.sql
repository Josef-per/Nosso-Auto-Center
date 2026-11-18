
-- NOSSO AUTO CENTER
-- Etapa 2: perfis de usuarios

CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id)
        ON DELETE CASCADE,
    nome TEXT,
    telefone TEXT,
    papel TEXT NOT NULL DEFAULT 'cliente'
        CHECK (papel IN ('cliente', 'admin')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Permissoes: clientes nao podem alterar papeis
REVOKE ALL ON public.perfis
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.perfis TO authenticated;
GRANT UPDATE (nome, telefone)
ON public.perfis TO authenticated;

-- Cada usuario consulta apenas seu perfil
CREATE POLICY "ler_proprio_perfil"
ON public.perfis
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = id);

-- Cada usuario edita apenas seus dados permitidos
CREATE POLICY "editar_proprio_perfil"
ON public.perfis
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- Criar perfil automaticamente ao cadastrar conta
CREATE OR REPLACE FUNCTION public.criar_perfil_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.perfis (id, nome)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'nome'
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER ao_criar_usuario
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.criar_perfil_usuario();
