const pedidoConfirmado = /^\/pedido-confirmado\/[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export function destinoAposAcesso(search) {
  const destino = new URLSearchParams(search).get('continuar') ?? '';
  return destino === '/checkout' || pedidoConfirmado.test(destino) ? destino : '/minha-conta';
}

export function caminhoAcesso(rota, destino) {
  return destino === '/minha-conta' ? rota : `${rota}?${new URLSearchParams({ continuar: destino })}`;
}
