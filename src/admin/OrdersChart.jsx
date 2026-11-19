import { useId } from 'react';
import { formatarPreco } from '../lib/formatarPreco';
import { pontosSerie, rotuloDia } from './dashboardUtils';

export default function OrdersChart({ serie }) {
  const titulo = useId();
  const descricao = useId();
  const { maximo, pontos } = pontosSerie(serie);
  const quantidade = serie.reduce((total, dia) => total + Number(dia.quantidade), 0);
  const valor = serie.reduce((total, dia) => total + Number(dia.valor), 0);
  if (!quantidade) return <div className="dashboard-empty"><p>Nenhum pedido não cancelado neste período.</p><span>Os dias do intervalo estão disponíveis com valor zero na tabela abaixo.</span><SeriesTable serie={serie} /></div>;
  return <>
    <div className="chart-summary"><strong>{formatarPreco(valor)}</strong><span>{quantidade} pedidos não cancelados no período</span></div>
    <svg className="orders-chart" viewBox="0 0 900 280" role="img" aria-labelledby={`${titulo} ${descricao}`}>
      <title id={titulo}>Valor diário dos pedidos não cancelados</title>
      <desc id={descricao}>Valores demonstrativos em reais. Datas em São Paulo. Consulte todos os valores na tabela abaixo.</desc>
      {[0, .5, 1].map((fracao) => <g key={fracao}><line x1="100" x2="860" y1={220 - fracao * 170} y2={220 - fracao * 170} className="chart-grid" /><text x="88" y={225 - fracao * 170} textAnchor="end">{new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(maximo * fracao)}</text></g>)}
      <text x="100" y="35">R$ · valores simulados</text>
      {pontos.length > 1 && <polygon points={`100,220 ${pontos.map((p) => `${p.x},${p.y}`).join(' ')} 860,220`} className="chart-area" />}
      <polyline points={pontos.map((p) => `${p.x},${p.y}`).join(' ')} className="chart-line" />
      {pontos.length <= 31 && pontos.map((ponto) => <circle key={ponto.dia} cx={ponto.x} cy={ponto.y} r="4" className="chart-dot"><title>{rotuloDia(ponto.dia)}: {formatarPreco(Number(ponto.valor))} · {ponto.quantidade} pedidos</title></circle>)}
      <text x="100" y="260">{rotuloDia(serie[0].dia)}</text><text x="860" y="260" textAnchor="end">{rotuloDia(serie.at(-1).dia)}</text>
    </svg>
    <SeriesTable serie={serie} />
  </>;
}

function SeriesTable({ serie }) {
  return <details className="chart-data"><summary>Consultar valores por dia</summary><div className="dashboard-scroll" tabIndex={0} role="region" aria-label="Valores diários dos pedidos"><table className="admin-table"><caption>Datas em São Paulo; somente pedidos não cancelados</caption><thead><tr><th scope="col">Data</th><th scope="col">Pedidos</th><th scope="col">Valor simulado</th></tr></thead><tbody>{serie.map((dia) => <tr key={dia.dia}><th scope="row">{rotuloDia(dia.dia)}</th><td>{dia.quantidade}</td><td>{formatarPreco(Number(dia.valor))}</td></tr>)}</tbody></table></div></details>;
}
