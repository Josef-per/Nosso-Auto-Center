
import { createClient } from '@supabase/supabase-js';
import { criarRecuperacaoSenha } from '../auth/recuperacaoSenha';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export const recuperacaoSenha = criarRecuperacaoSenha(supabase.auth, () => {
  if (typeof window !== 'undefined' && window.location.pathname === '/redefinir-senha') {
    // Após o SDK consumir o retorno, remove tokens/códigos/erros da barra e do histórico.
    window.history.replaceState(window.history.state, '', '/redefinir-senha');
  }
});
