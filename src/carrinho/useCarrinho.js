import { createContext, useContext } from 'react';

export const CarrinhoContext = createContext(null);

export function useCarrinho() {
  return useContext(CarrinhoContext);
}

export function quantidadeDoProduto(itens, produtoId) {
  return itens.reduce(
    (total, item) => item.produtoId === String(produtoId) ? total + item.quantidade : total,
    0,
  );
}
