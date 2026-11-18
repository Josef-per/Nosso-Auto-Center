import PaymentSummary from '../components/PaymentSummary';
import DeliveryDetails from './DeliveryDetails';
import { useState } from 'react';
import { atualizarStatusAdmin } from '../services/adminService';
import { formatarPreco } from '../lib/formatarPreco';
import StatusPedido from '../components/StatusPedido';
const transicoes = { pendente: ['confirmado', 'cancelado'], confirmado: ['enviado', 'cancelado'], enviado: ['entregue'], entregue: [], cancelado: [] };
export default function OrderManager({ pedidos, onChanged }) {
  const [ocupado, setOcupado] = useState(null);
  const [erro, setErro] = useState('');
  const [confirmacao, setConfirmacao] = useState(null);
  async function atualizar(pedido, status) {
    setOcupado(pedido.id); setErro('');
    try { await atualizarStatusAdmin(pedido.id, status, pedido.status); setConfirmacao(null); onChanged(); }
    catch (error) { setErro(error.message); }
    finally { setOcupado(null); }
  }
  return <section className="panel" aria-labelledby="titulo-pedidos-admin"><h2 id="titulo-pedidos-admin">Pedidos recentes</h2>
    <p className="text-muted">Até 100 pedidos mais recentes. Confirmar um pedido altera somente sua etapa de atendimento. Pagamentos permanecem simulados, sem processamento.</p>
    {erro && <p className="notice" role="alert">{erro}</p>}
    {pedidos.length ? <ul className="admin-orders">{pedidos.map((pedido) => <li key={pedido.id}>
      <div><strong className="pedido-id">{pedido.id}</strong><p className="text-muted">{new Date(pedido.criado_em).toLocaleString('pt-BR')} · {formatarPreco(Number(pedido.total))}</p><span>Atendimento: <StatusPedido status={pedido.status} /></span>
        <PaymentSummary method={pedido.metodo_pagamento} status={pedido.status_pagamento} />
        <DeliveryDetails entrega={pedido.entrega} />
        <details><summary>Consultar itens</summary><ul className="pedido-linhas">{(pedido.itens ?? []).map((item) => <li key={item.id}><span>{item.quantidade} × {item.nome_produto}</span><span>{formatarPreco(Number(item.subtotal))}</span></li>)}</ul></details>
      </div>
      <div className="checkout-actions">{(transicoes[pedido.status] ?? []).map((status) => <button key={status} className="pill" type="button" disabled={ocupado !== null} onClick={() => status === 'cancelado' ? setConfirmacao(pedido.id) : atualizar(pedido, status)}>{ocupado === pedido.id ? 'Salvando…' : { confirmado: 'Confirmar atendimento', enviado: 'Marcar como enviado', entregue: 'Marcar como entregue', cancelado: 'Cancelar pedido' }[status]}</button>)}</div>
      {confirmacao === pedido.id && <div className="notice"><p>Cancelar este pedido e devolver as unidades ao estoque? Essa mudança encerra o atendimento.</p><div className="checkout-actions"><button className="pill" type="button" disabled={ocupado !== null} onClick={() => atualizar(pedido, 'cancelado')}>Confirmar cancelamento</button><button className="pill" type="button" disabled={ocupado !== null} onClick={() => setConfirmacao(null)}>Manter pedido</button></div></div>}
    </li>)}</ul> : <p className="text-muted">Nenhum pedido registrado.</p>}
  </section>;
}
