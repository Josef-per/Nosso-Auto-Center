import { supabase } from '../lib/supabaseClient';
import { validarAvaliacao } from '../lib/avaliacoes';
import { idProdutoValido } from './produtoService';

export async function consultarAvaliacoes(produtoId, pagina = 0) {
  if (!idProdutoValido(produtoId)) throw new Error('Produto inválido.');
  const { data, error } = await supabase.rpc('consultar_avaliacoes', { p_produto_id: produtoId, p_pagina: pagina });
  if (error && ['PGRST202', 'PGRST205', '42883', '42P01'].includes(error.code)) return null;
  if (error) throw new Error('Não foi possível carregar as avaliações. Tente novamente.');
  return data;
}
export async function buscarMinhaAvaliacao(produtoId, usuarioId) {
  const { data, error } = await supabase.from('avaliacoes_produtos').select('id, nota, comentario')
    .eq('produto_id', produtoId).eq('usuario_id', usuarioId).maybeSingle();
  if (error) throw new Error('Não foi possível consultar sua avaliação.');
  return data;
}
export async function salvarAvaliacao(produtoId, usuarioId, nota, comentario, editando = false) {
  if (!usuarioId || !idProdutoValido(produtoId)) throw new Error('Entre na sua conta para avaliar este produto.');
  const valores = validarAvaliacao(nota, comentario);
  // Autor é definido por auth.uid() no banco; UPDATE só recebe nota/comentário.
  const query = editando
    ? supabase.from('avaliacoes_produtos').update(valores).eq('produto_id', produtoId).eq('usuario_id', usuarioId)
    : supabase.from('avaliacoes_produtos').insert({ produto_id: produtoId, ...valores });
  const { error } = await query.select('id').single();
  if (error?.code === '23505') throw new Error('Você já avaliou este produto. Atualize a página para editar sua avaliação.');
  if (error) throw new Error('Não foi possível salvar. Confira sua sessão e tente novamente.');
}
export async function removerAvaliacao(produtoId, usuarioId) {
  if (!usuarioId || !idProdutoValido(produtoId)) throw new Error('Entre na sua conta para remover sua avaliação.');
  const { error } = await supabase.from('avaliacoes_produtos').delete()
    .eq('produto_id', produtoId).eq('usuario_id', usuarioId).select('id').single();
  if (error) throw new Error('Não foi possível remover a avaliação. Tente novamente.');
}
