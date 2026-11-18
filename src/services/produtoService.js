
import { supabase } from '../lib/supabaseClient';

const camposCatalogo = 'id, nome, marca, preco, preco_antigo, imagem_url, selo, estoque, categorias(nome)';

function consultarCatalogo(campos = camposCatalogo) {
  return supabase
    .from('produtos')
    .select(campos)
    .eq('ativo', true);
}

function formatarProduto(produto) {
  return {
    id: produto.id,
    name: produto.nome,
    brand: produto.marca ?? '',
    category: produto.categorias?.nome ?? 'Outros',
    price: Number(produto.preco),
    oldPrice: Number(produto.preco_antigo ?? 0),
    badge: produto.selo ?? '',
    image: produto.imagem_url || '/favicon.svg',
    stock: produto.estoque,
  };
}

export function idProdutoValido(id) {
  const valor = String(id);
  return /^[1-9]\d{0,18}$/.test(valor) && BigInt(valor) <= 9223372036854775807n;
}

export async function listarProdutos() {
  const { data, error } = await consultarCatalogo().order('id');
  if (error) throw new Error(error.message);
  return data.map(formatarProduto);
}

export async function buscarProduto(id) {
  if (!idProdutoValido(id)) return null;
  const { data, error } = await consultarCatalogo(`${camposCatalogo}, descricao`).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { ...formatarProduto(data), description: data.descricao ?? '' } : null;
}

export async function buscarProdutosPorIds(ids) {
  if (!ids.length) return [];
  const { data, error } = await consultarCatalogo().in('id', ids);
  if (error) throw new Error(error.message);
  return data.map(formatarProduto);
}
