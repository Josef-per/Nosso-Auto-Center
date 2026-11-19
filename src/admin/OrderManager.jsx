import SelectField from '../components/SelectField';
import PaymentSummary from '../components/PaymentSummary';
import DeliveryDetails from './DeliveryDetails';
import { useRef, useState } from 'react';
import { dataSaoPaulo, statusPedidos } from './dashboardUtils';
import { atualizarStatusAdmin } from '../services/adminService';
import { formatarPreco } from '../lib/formatarPreco';
import StatusPedido from '../components/StatusPedido';
const transicoes = { pendente: ['confirmado', 'cancelado'], confirmado: ['enviado', 'cancelado'], enviado: ['entregue'], entregue: [], cancelado: [] };
export default function OrderManager({ pedidos, onChanged }) {
  const [ocupado, setOcupado] = useState(null);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [confirmacao, setConfirmacao] = useState(null);
  const envio = useRef(false);
  async function atualizar(pedido, status) {
    if (envio.current) return;
    envio.current = true;
    setOcupado(pedido.id); setErro(''); setMensagem('');
    try { await atualizarStatusAdmin(pedido.id, status, pedido.status); setConfirmacao(null); setMensagem('Etapa de atendimento atualizada.'); onChanged(); }
    catch (error) { setErro(error.message); }
    finally { envio.current = false; setOcupado(null); }
  }
  return <section className="panel" aria-labelledby="titulo-pedidos-admin"><p className="eyebrow">HISTÓRICO ADMINISTRATIVO</p><h2 id="titulo-pedidos-admin">Pedidos</h2>
    <label className="field" htmlFor="filtro-pedidos">Etapa de atendimento</label><SelectField id="filtro-pedidos" className="forminput" value={filtro} onChange={(e) => setFiltro(e.target.value)}><option value="todos">Todos os pedidos</option>{statusPedidos.map((status) => <option value={status} key={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</SelectField>
    <p className="text-muted">Até 100 pedidos mais recentes. Confirmar um pedido altera somente sua etapa de atendimento. Pagamentos permanecem simulados, sem processamento.</p>
    {erro && <p className="notice" role="alert">{erro}</p>}
    {mensagem && <p className="profile-success" role="status">{mensagem}</p>}
    {pedidos.filter((p) => filtro === 'todos' || p.status === filtro).length ? <ul className="admin-orders">{pedidos.filter((p) => filtro === 'todos' || p.status === filtro).map((pedido) => <li key={pedido.id}>
      <div><strong className="pedido-id">{pedido.id}</strong><p className="text-muted">{dataSaoPaulo(pedido.criado_em)} (São Paulo) · {formatarPreco(Number(pedido.total))}</p><span>Atendimento: <StatusPedido status={pedido.status} /></span>
        <p className="text-muted">Produtos: {pedido.subtotal_produtos == null ? 'Não registrado' : formatarPreco(Number(pedido.subtotal_produtos))} · Frete: {pedido.frete == null ? 'Não registrado' : formatarPreco(Number(pedido.frete))}</p>
        <PaymentSummary method={pedido.metodo_pagamento} status={pedido.status_pagamento} />
        <DeliveryDetails entrega={pedido.entrega} />
        <details><summary>Consultar itens</summary><ul className="pedido-linhas">{(pedido.itens ?? []).map((item) => <li key={item.id}><span>{item.quantidade} × {item.nome_produto}</span><span>{formatarPreco(Number(item.subtotal))}</span></li>)}</ul></details>
      </div>
      <div className="checkout-actions">{(transicoes[pedido.status] ?? []).map((status) => <button key={status} className={status === 'cancelado' ? 'pill danger' : 'pill'} type="button" disabled={ocupado !== null} onClick={() => status === 'cancelado' ? setConfirmacao(pedido.id) : atualizar(pedido, status)}>{ocupado === pedido.id ? 'Salvando…' : { confirmado: 'Confirmar atendimento', enviado: 'Marcar como enviado', entregue: 'Marcar como entregue', cancelado: 'Cancelar pedido' }[status]}</button>)}</div>
      {confirmacao === pedido.id && <div className="notice"><p>Cancelar este pedido e devolver as unidades ao estoque? Essa mudança encerra o atendimento.</p><div className="checkout-actions"><button className="pill danger" type="button" disabled={ocupado !== null} onClick={() => atualizar(pedido, 'cancelado')}>Confirmar cancelamento</button><button className="pill" type="button" disabled={ocupado !== null} onClick={() => setConfirmacao(null)}>Manter pedido</button></div></div>}
    </li>)}</ul> : <p className="text-muted">Nenhum pedido nesta seleção.</p>}
  </section>;
}
