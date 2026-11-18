export function subtotalItem({ produto, quantidade }) {
  return produto ? Math.round(produto.price * 100) * quantidade : 0;
}

export function totalCarrinho(itens) {
  return itens.reduce((total, item) => total + subtotalItem(item), 0) / 100;
}
