import { supabase } from '../lib/supabaseClient';

const processando = new Set();
const aConferir = new Set();
const idValido = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
const mensagemIncerta = 'Não foi possível confirmar se o pedido foi registrado. Confira Meus Pedidos antes de enviar novamente.';

function consultarPedidos(usuarioId) {
  return supabase
    .from('pedidos')
    .select('id, criado_em, total, status')
    .eq('usuario_id', usuarioId);
}

export async function listarPedidos(usuarioId) {
  const { data, error } = await consultarPedidos(usuarioId).order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function buscarPedido(usuarioId, id) {
  if (!idValido.test(id)) return null;
  const { data: pedido, error } = await consultarPedidos(usuarioId).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!pedido) return null;

  const { data: itens, error: erroItens } = await supabase
    .from('pedido_itens')
    .select('id, nome_produto, quantidade, preco_unitario, subtotal')
    .eq('pedido_id', pedido.id)
    .order('id');
  if (erroItens) throw erroItens;

  return {
    ...pedido,
    itens: itens.map((item) => ({
      id: item.id,
      nome: item.nome_produto,
      quantidade: item.quantidade,
      precoUnitario: Number(item.preco_unitario),
      subtotal: Number(item.subtotal),
    })),
  };
}

function chave(usuarioId) {
  return `nosso-auto-center:pedido-a-conferir:${usuarioId}`;
}

function marcarEnvio(usuarioId) {
  aConferir.add(usuarioId);
  try {
    sessionStorage.setItem(chave(usuarioId), '1');
  } catch {
    // O bloqueio em memória continua valendo quando o armazenamento não está disponível.
  }
}

export function pedidoAConferir(usuarioId) {
  if (aConferir.has(usuarioId)) return true;
  try {
    return sessionStorage.getItem(chave(usuarioId)) === '1';
  } catch {
    return false;
  }
}

export function liberarNovoEnvio(usuarioId) {
  if (processando.has(usuarioId)) return false;
  aConferir.delete(usuarioId);
  try {
    sessionStorage.removeItem(chave(usuarioId));
  } catch {
    // O bloqueio em memória já foi removido.
  }
  return true;
}

function mensagemRpc({ error, status }) {
  if (!status || status === 408 || status >= 500) return null;
  const detalhe = [error.message, error.details, error.hint].join(' ').toLowerCase();
  if (/indispon[ií]v|inativ|unavailable|not found|n[aã]o encontrad/.test(detalhe)
    && /produt|product/.test(detalhe)) {
    return 'Um produto do carrinho está indisponível. Revise os itens antes de continuar.';
  }
  if (/estoque|stock/.test(detalhe)) {
    return 'O estoque mudou e não cobre a quantidade solicitada. Revise o carrinho.';
  }
  if (error.code === '23514' && /quantidade|quantity/.test(detalhe)) {
    return 'Cada item do pedido aceita até 99 unidades. Revise o carrinho.';
  }
  if (/carrinho.*(vazio|sem itens)|empty cart/.test(detalhe)) {
    return 'O carrinho da conta está vazio.';
  }
  if (status === 401 || status === 403) return 'A sessão não autorizou a compra. Entre na sua conta e confira o carrinho.';
  return 'Não foi possível registrar o pedido. Revise o carrinho e tente novamente.';
}

export async function finalizarPedido(usuarioId, endereco) {
  if (processando.has(usuarioId)) return { erro: 'Ainda há um envio em andamento. Aguarde a resposta.' };
  if (pedidoAConferir(usuarioId)) return { erro: mensagemIncerta, incerto: true };

  marcarEnvio(usuarioId);
  processando.add(usuarioId);
  let resultado;
  try {
    const resposta = await supabase.rpc('finalizar_pedido', { p_endereco_entrega: endereco }).retry(false);
    if (resposta.error) {
      const erro = mensagemRpc(resposta);
      if (erro) resultado = { erro };
    } else if (typeof resposta.data === 'string' && idValido.test(resposta.data)) {
      resultado = { id: resposta.data };
    }
  } catch {
    // Sem uma resposta válida, a transação pode ter sido concluída.
  } finally {
    processando.delete(usuarioId);
  }

  if (!resultado) return { erro: mensagemIncerta, incerto: true };
  liberarNovoEnvio(usuarioId);
  return resultado;
}
