import { supabase } from '../lib/supabaseClient';
async function rpc(nome, parametros) {
  const { data, error } = await supabase.rpc(nome, parametros);
  if (error) {
    const mensagem = ['42501', 'PGRST301'].includes(error.code) ? 'Acesso administrativo não autorizado.'
      : error.code === 'PGRST202' ? 'As funções administrativas ainda não estão disponíveis no servidor.'
        : error.code === '23505' ? 'Já existe um produto com este identificador (slug).'
          : error.code === '22023' ? error.message : 'Não foi possível concluir a operação. Recarregue os dados antes de tentar novamente.';
    throw new Error(mensagem, { cause: error });
  }
  return data;
}
export const verificarAdmin = () => rpc('usuario_admin');
export const carregarResumoAdmin = () => rpc('admin_resumo');
export const listarProdutosAdmin = () => rpc('admin_listar_produtos');
export const listarPedidosAdmin = () => rpc('admin_listar_pedidos');
export async function listarCategoriasAdmin() {
  const { data, error } = await supabase.from('categorias').select('id, nome').order('nome');
  if (error) throw new Error('Não foi possível carregar as categorias.', { cause: error });
  return data;
}
export const salvarProdutoAdmin = (produto) => rpc('admin_salvar_produto', { p_produto: produto });
export const desativarProdutoAdmin = (id) => rpc('admin_desativar_produto', { p_id: id });
export const atualizarStatusAdmin = (id, status, statusAtual) => rpc('admin_atualizar_status', { p_id: id, p_status: status, p_status_atual: statusAtual });
