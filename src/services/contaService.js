import { recuperacaoSenha, supabase } from '../lib/supabaseClient';
import { validarNovaSenha } from '../lib/segurancaConta';

export async function solicitarRecuperacaoSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: new URL('/redefinir-senha', window.location.origin).href,
  });
  // Endereços desconhecidos recebem a mesma resposta da interface.
  if (error && !['user_not_found', 'email_not_found'].includes(error.code)) throw error;
}

export async function redefinirSenha(novaSenha) {
  const validacao = validarNovaSenha(novaSenha);
  if (validacao) throw new Error(validacao);
  await recuperacaoSenha.conferir();
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw error;
  recuperacaoSenha.invalidar();
}

export async function encerrarRecuperacaoSenha() {
  // Invalida somente a sessão local usada na recuperação, nunca scope global/others.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
  recuperacaoSenha.invalidar();
}

// A conferência de current_password deve ser exigida pelo Supabase Auth.
// Nunca reabrir uma sessão com signInWithPassword para validar esta operação.
export async function alterarSenha(senhaAtual, novaSenha, nonce) {
  const validacao = validarNovaSenha(novaSenha);
  if (validacao) throw new Error(validacao);
  const { error } = await supabase.auth.updateUser({
    current_password: senhaAtual,
    password: novaSenha,
    ...(nonce ? { nonce } : {}),
  });
  if (error) throw error;
}

export async function solicitarAlteracaoEmail(email, nonce) {
  const { error } = await supabase.auth.updateUser(
    { email: email.trim(), ...(nonce ? { nonce } : {}) },
    { emailRedirectTo: new URL('/minha-conta#seguranca', window.location.origin).href },
  );
  if (error) throw error;
}

export async function solicitarReautenticacao() {
  const { error } = await supabase.auth.reauthenticate();
  if (error) throw error;
}

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
  const validacao = validarNovaSenha(password);
  if (validacao) throw new Error(validacao);
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
