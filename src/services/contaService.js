import { supabase } from '../lib/supabaseClient';

export function observarSessao(onChange) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => onChange(session),
  );
  return () => subscription.unsubscribe();
}

export async function entrar(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function cadastrar(nome, email, password, destino = '/minha-conta') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome },
      emailRedirectTo: new URL(destino, window.location.origin).href,
    },
  });
  if (error) throw error;
  return data.session;
}

export async function sair() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function carregarPerfil(id) {
  const { data, error } = await supabase
    .from('perfis')
    .select('nome, telefone')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function salvarPerfil(id, { nome, telefone }) {
  const { data, error } = await supabase
    .from('perfis')
    .update({ nome, telefone })
    .eq('id', id)
    .select('nome, telefone')
    .single();
  if (error) throw error;
  return data;
}
