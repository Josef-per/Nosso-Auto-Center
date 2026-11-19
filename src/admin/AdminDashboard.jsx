import { useEffect, useState } from 'react';
import { Banknote, ShoppingBag, ReceiptText, Clock3, CircleX, Package, Warehouse, ArrowUpRight } from 'lucide-react';
import { carregarDashboardAdmin } from '../services/adminService';
import { formatarPreco } from '../lib/formatarPreco';
import SelectField from '../components/SelectField';
import StatusPedido from '../components/StatusPedido';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import OrdersChart from './OrdersChart';
import { dataSaoPaulo, rotuloDia } from './dashboardUtils';

export default function AdminDashboard({ versao, pedidos, onEdit, onOrders }) {
  const [periodo, setPeriodo] = useState('30');
  const [tentativa, setTentativa] = useState(0);
  const [resultado, setResultado] = useState(null);
  const chave = `${versao}:${periodo}:${tentativa}`;
  useEffect(() => {
    let ativo = true;
    carregarDashboardAdmin(periodo === 'completo' ? null : Number(periodo)).then(
      (dados) => { if (ativo) setResultado({ chave, dados }); },
      (error) => { if (ativo) setResultado({ chave, erro: error.message }); },
    );
    return () => { ativo = false; };
  }, [chave, periodo]);
  const dados = resultado?.chave === chave ? resultado.dados : null;
  const erro = resultado?.chave === chave ? resultado.erro : '';
  const r = dados?.resumo;
  const cards = r ? [
    { titulo: 'Valor dos pedidos', valor: formatarPreco(Number(r.valor_pedidos)), detalhe: 'Não cancelados · valor simulado', Icon: Banknote },
    { titulo: 'Total de pedidos', valor: r.pedidos, detalhe: 'Todos os status de atendimento', Icon: ShoppingBag },
    { titulo: 'Ticket médio', valor: formatarPreco(Number(r.ticket_medio)), detalhe: 'Somente pedidos não cancelados', Icon: ReceiptText },
    { titulo: 'Pedidos pendentes', valor: r.pendentes, detalhe: 'Aguardando atendimento', Icon: Clock3 },
    { titulo: 'Pedidos cancelados', valor: r.cancelados, detalhe: 'Excluídos dos valores simulados', Icon: CircleX },
    { titulo: 'Produtos ativos', valor: r.produtos_ativos, detalhe: 'Disponíveis no catálogo', Icon: Package },
    { titulo: 'Estoque em atenção', valor: Number(r.estoque_zerado) + Number(r.estoque_baixo), detalhe: `${r.estoque_zerado} zerados · ${r.estoque_baixo} com 1 a 5 unidades`, Icon: Warehouse },
  ] : [];
  return <section className="dashboard" aria-labelledby="dashboard-title" aria-busy={!dados && !erro}>
    <div className="section-head dashboard-heading"><div><h2 id="dashboard-title">Visão geral</h2><p className="text-muted">Indicadores de todo o histórico, sem limite de 100 pedidos.</p></div>
      {dados && <span className="dashboard-updated">Atualizado em {dataSaoPaulo(dados.gerado_em)} · SP</span>}
    </div>
    {erro ? <ErrorState title="Métricas indisponíveis" message={erro} onRetry={() => setTentativa((n) => n + 1)} />
      : !dados ? <LoadingState message="Consultando os indicadores da operação…" /> : <>
        <div className="dashboard-cards">{cards.map(({ titulo, valor, detalhe, Icon }) => <article className="panel metric-card" key={titulo}>
          <span className="metric-icon"><Icon size={21} aria-hidden="true" /></span><h3>{titulo}</h3><strong>{valor}</strong><p>{detalhe}</p>
        </article>)}</div>
        <p className="dashboard-financial-note">Valores incluem o total do pedido, com frete quando registrado. Não representam receita recebida. {r.pagamento_nao_informado} pedidos sem identificação de pagamento simulado; não são considerados pagamentos confirmados.</p>
        <div className="dashboard-grid">
          <section className="panel dashboard-period" aria-labelledby="chart-title"><div className="section-head"><div><p className="eyebrow">EVOLUÇÃO DOS PEDIDOS</p><h3 id="chart-title">Pedidos por período</h3></div><div className="dashboard-period-filter"><label className="field" htmlFor="dashboard-periodo">Intervalo do gráfico</label><SelectField id="dashboard-periodo" value={periodo} onChange={(event) => setPeriodo(event.target.value)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="completo">Período completo</option></SelectField></div></div>
            <p className="text-muted">{rotuloDia(dados.inicio)} a {rotuloDia(dados.fim)} · horário de São Paulo</p><OrdersChart serie={dados.serie} />
          </section>
          <section className="panel" aria-labelledby="status-title"><p className="eyebrow">TODO O HISTÓRICO</p><h3 id="status-title">Pedidos por status</h3><p className="text-muted">Etapa de atendimento, independente do pagamento.</p>
            <ul className="dashboard-status">{dados.status.map((item) => <li key={item.status}><div><StatusPedido status={item.status} /><strong>{item.quantidade}</strong></div><div className="dashboard-meter" aria-hidden="true"><span data-status={item.status} style={{ width: `${r.pedidos ? Number(item.quantidade) / Number(r.pedidos) * 100 : 0}%` }} /></div></li>)}</ul>
            {!Number(r.pedidos) && <p className="text-muted">Nenhum pedido registrado.</p>}
          </section>
          <section className="panel" aria-labelledby="best-title"><p className="eyebrow">TODO O HISTÓRICO</p><h3 id="best-title">Produtos mais vendidos</h3><p className="text-muted">Unidades em pedidos não cancelados · vendas simuladas.</p>
            {dados.mais_vendidos.length ? <ol className="dashboard-best">{dados.mais_vendidos.map((produto, index) => <li key={`${produto.produto_id}:${produto.nome}`}><span className="dashboard-rank">{index + 1}</span><span>{produto.nome}</span><strong>{produto.quantidade}<small>unidades</small></strong></li>)}</ol> : <p className="dashboard-empty">Ainda não há itens em pedidos não cancelados.</p>}
          </section>
          <section className="panel" aria-labelledby="stock-title"><p className="eyebrow">CATÁLOGO ATIVO</p><h3 id="stock-title">Alertas de estoque</h3><p className="text-muted">Até 12 produtos, priorizando estoque zerado.</p>
            {dados.estoque.length ? <ul className="dashboard-stock">{dados.estoque.map((produto) => <li key={produto.id}><div><strong>{produto.nome}</strong><span className={produto.estoque === 0 ? 'stock-zero' : ''}>{produto.estoque === 0 ? 'Sem estoque' : `${produto.estoque} unidades restantes`}</span></div><button className="pill" type="button" aria-label={`Editar estoque de ${produto.nome}`} onClick={() => onEdit(produto)}>Editar<ArrowUpRight size={15} aria-hidden="true" /></button></li>)}</ul> : <p className="dashboard-empty">Nenhum produto ativo com estoque baixo ou zerado.</p>}
          </section>
        </div>
      </>}
    <section className="panel dashboard-recent" aria-labelledby="recent-title"><div className="section-head"><div><p className="eyebrow">ACOMPANHAMENTO</p><h3 id="recent-title">Pedidos recentes</h3></div><button className="pill" type="button" onClick={onOrders}>Ver pedidos<ArrowUpRight size={16} aria-hidden="true" /></button></div>
      {pedidos.length ? <div className="admin-table-wrap" role="region" aria-label="Pedidos recentes" tabIndex={0}><table className="admin-table"><caption>Últimos 5 pedidos · pagamento sempre demonstrativo</caption><thead><tr><th scope="col">Pedido</th><th scope="col">Data (SP)</th><th scope="col">Valor simulado</th><th scope="col">Atendimento</th><th scope="col">Pagamento</th></tr></thead><tbody>{pedidos.slice(0, 5).map((pedido) => <tr key={pedido.id}><th scope="row"><span className="pedido-id">{pedido.id.slice(0, 8)}</span></th><td>{dataSaoPaulo(pedido.criado_em)}</td><td>{formatarPreco(Number(pedido.total))}</td><td><StatusPedido status={pedido.status} /></td><td>{pedido.status_pagamento === 'simulado' ? 'Simulado — não processado' : 'Não informado como simulado'}</td></tr>)}</tbody></table></div> : <p className="dashboard-empty">Os novos pedidos aparecerão aqui.</p>}
    </section>
  </section>;
}
