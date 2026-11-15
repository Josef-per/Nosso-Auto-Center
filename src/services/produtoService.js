
import { supabase } from '../lib/supabaseClient';

export async function listarProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select(`
      id,
      nome,
      marca,
      preco,
      preco_antigo,
      imagem_url,
      selo,
      estoque,
      categorias(nome)
    `)
    .eq('ativo', true)
    .order('id');

  if (error) {
    throw new Error(error.message);
  }

  return data.map((produto) => ({
    id: produto.id,
    name: produto.nome,
    brand: produto.marca ?? '',
    category: produto.categorias?.nome ?? 'Outros',
    price: Number(produto.preco),
    oldPrice: Number(produto.preco_antigo ?? 0),
    badge: produto.selo ?? '',
    image: produto.imagem_url || '/favicon.svg',
    stock: produto.estoque
  }));
}
