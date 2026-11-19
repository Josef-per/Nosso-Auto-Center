export const statusPedidos = ['pendente', 'confirmado', 'enviado', 'entregue', 'cancelado'];
export function dataSaoPaulo(valor) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor));
}
export function rotuloDia(dia) {
  const [ano, mes, data] = dia.split('-');
  return `${data}/${mes}/${ano}`;
}
export function pontosSerie(serie) {
  const maximo = Math.max(1, ...serie.map((ponto) => Number(ponto.valor)));
  return { maximo, pontos: serie.map((ponto, index) => ({
    ...ponto, x: serie.length === 1 ? 470 : 100 + index * 760 / (serie.length - 1),
    y: 220 - Number(ponto.valor) / maximo * 170,
  })) };
}
