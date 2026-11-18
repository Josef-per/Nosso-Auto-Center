import { supabase } from '../lib/supabaseClient';
import { buscarProdutosPorIds, idProdutoValido } from './produtoService';

const chaveVisitante = 'nosso-auto-center:carrinho';
const colunas = 'id, produto_id, quantidade';

function lerCarrinhoLocal() {
  const dados = localStorage.getItem(chaveVisitante);
  if (!dados) return [];

  let itens;
  try {
    itens = JSON.parse(dados);
  } catch {
    return [];
  }

  if (!Array.isArray(itens)) return [];
  const validos = new Map();
  for (const item of itens) {
    if (!idProdutoValido(item?.produtoId) || !Number.isSafeInteger(item.quantidade) || item.quantidade < 1) continue;
    const produtoId = String(item.produtoId);
    validos.set(produtoId, { id: produtoId, produtoId, quantidade: item.quantidade });
  }
  return [...validos.values()];
}

function salvarCarrinhoLocal(itens) {
  const dados = itens.map(({ produtoId, quantidade }) => ({ produtoId, quantidade }));
  localStorage.setItem(chaveVisitante, JSON.stringify(dados));
}

function normalizarItem({ id, produto_id, quantidade }) {
  return { id: String(id), produtoId: String(produto_id), quantidade };
}

function consultarItens(usuarioId) {
  return supabase.from('carrinho_itens').select(colunas).eq('usuario_id', usuarioId);
}

async function lerItens(usuarioId) {
  if (!usuarioId) return lerCarrinhoLocal();

  const { data, error } = await consultarItens(usuarioId).order('criado_em').order('id');
  if (error) throw new Error('Não foi possível acessar seu carrinho.');
  return data.map(normalizarItem);
}

async function consultarProdutos(itens, produtoId) {
  const ids = new Set(itens.map((item) => item.produtoId));
  if (produtoId) ids.add(produtoId);
  try {
    const produtos = await buscarProdutosPorIds([...ids]);
    return new Map(produtos.map((produto) => [String(produto.id), produto]));
  } catch {
    throw new Error('Não foi possível consultar os preços e o estoque. Tente novamente.');
  }
}

function incluirProdutos(itens, produtos) {
  return itens.map((item) => ({ ...item, produto: produtos.get(item.produtoId) ?? null }));
}

export async function carregarCarrinho(usuarioId) {
  const itens = await lerItens(usuarioId);
  return incluirProdutos(itens, await consultarProdutos(itens));
}

function conferirAlteracao({ data, error }) {
  if (error?.code === '23505' || (!error && !data)) {
    throw new Error('O carrinho mudou. Atualize a página e tente novamente.');
  }
  if (error) throw new Error('Não foi possível salvar a alteração no carrinho. Tente novamente.');
}

async function gravarItem(usuarioId, item, produtoId, quantidade) {
  const tabela = supabase.from('carrinho_itens');
  if (!item) {
    const resultado = await tabela
      .insert({ usuario_id: usuarioId, produto_id: produtoId, quantidade })
      .select(colunas)
      .maybeSingle();
    conferirAlteracao(resultado);
    return normalizarItem(resultado.data);
  }

  const escrita = quantidade === 0 ? tabela.delete() : tabela.update({ quantidade });
  const resultado = await escrita
    .eq('usuario_id', usuarioId)
    .eq('id', item.id)
    .eq('quantidade', item.quantidade)
    .select(colunas)
    .maybeSingle();
  conferirAlteracao(resultado);
  return quantidade ? normalizarItem(resultado.data) : null;
}

export async function alterarCarrinho(usuarioId, { acao, id, quantidade }) {
  const itens = await lerItens(usuarioId);
  const adicionando = acao === 'adicionar';
  const removendo = acao === 'remover';
  const item = adicionando
    ? itens.find((atual) => atual.produtoId === id)
    : itens.find((atual) => atual.id === id);

  if (!item && !adicionando) return incluirProdutos(itens, await consultarProdutos(itens));

  const produtoId = item?.produtoId ?? id;
  if (!idProdutoValido(produtoId)) throw new Error('Este produto não está mais disponível.');
  const novaQuantidade = adicionando ? (item?.quantidade ?? 0) + quantidade : quantidade;
  const restantes = itens.filter((atual) => atual.id !== item?.id);
  // Carrega os preços antes da escrita para uma falha de leitura não aparentar falha ao gravar.
  const produtos = await consultarProdutos(restantes, removendo ? undefined : produtoId);
  if (!removendo) {
    if (!Number.isSafeInteger(quantidade) || quantidade < 1) {
      throw new Error('Informe uma quantidade inteira maior que zero.');
    }
    const produto = produtos.get(produtoId);
    if (!produto) throw new Error('Este produto não está mais disponível.');

    const quantidadeOutros = restantes.reduce(
      (total, atual) => atual.produtoId === produtoId ? total + atual.quantidade : total,
      0,
    );
    if (novaQuantidade + quantidadeOutros > produto.stock) {
      throw new Error(`Estoque disponível: ${produto.stock}. Confira a quantidade já no carrinho.`);
    }
  }

  const alterado = usuarioId
    ? await gravarItem(usuarioId, item, produtoId, removendo ? 0 : novaQuantidade)
    : { id: produtoId, produtoId, quantidade: novaQuantidade };
  if (!removendo) {
    restantes.splice(item ? itens.indexOf(item) : restantes.length, 0, alterado);
  }
  if (!usuarioId) salvarCarrinhoLocal(restantes);
  return incluirProdutos(restantes, produtos);
}
