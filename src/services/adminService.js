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
export async function carregarDashboardAdmin(dias = 30) {
  if (dias !== null && dias !== 7 && dias !== 30) throw new Error('Período inválido.');
  try {
    const data = await rpc('admin_dashboard', { p_dias: dias });
    if (!data?.resumo || !Array.isArray(data.serie) || !Array.isArray(data.status) || !Array.isArray(data.mais_vendidos) || !Array.isArray(data.estoque)) throw new Error('O servidor retornou métricas incompatíveis. Revise a migração do dashboard.');
    return data;
  } catch (error) {
    if (error.cause?.code === 'PGRST202') throw new Error('As métricas ainda não estão disponíveis. A migração do dashboard precisa ser revisada e aplicada manualmente no servidor.', { cause: error });
    throw error;
  }
}
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
