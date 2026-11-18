import PaymentSummary from '../components/PaymentSummary';
import { Link, useParams } from 'react-router-dom';
import { useSessao } from '../auth/useSessao';
import ResumoPedido from '../components/ResumoPedido';
import StatusPedido from '../components/StatusPedido';
import { useConsultaPedidos } from '../pedidos/useConsultaPedidos';
import { buscarPedido } from '../services/pedidoService';

function DetalhesPedido({ usuarioId, id }) {
  const { dados: pedido, carregando, erro, recarregar } = useConsultaPedidos(buscarPedido, usuarioId, id);

  return (
    <div className="container pedido-confirmado">
      <div className="page-heading">
        <h1>{pedido ? 'Pedido registrado' : 'Detalhes do pedido'}</h1>
        {pedido && <p className="text-muted">Compra demonstrativa, sem processamento de pagamento real.</p>}
      </div>
      {carregando && <p role="status">Carregando pedido…</p>}
      {erro && (
        <>
          <p className="notice" role="alert">Não foi possível carregar o pedido.</p>
          <button className="pill" type="button" onClick={recarregar}>Tentar novamente</button>
        </>
      )}
      {pedido === null && <p className="notice" role="status">Pedido não encontrado.</p>}
      {pedido && (
        <>
          <dl className="panel pedido-identificacao">
            <div><dt>Identificador</dt><dd className="pedido-id">{pedido.id}</dd></div>
            <div><dt>Status de atendimento</dt><dd><StatusPedido status={pedido.status} /></dd></div>
          </dl>
          <section className="panel pedido-aviso" aria-labelledby="titulo-pagamento-pedido"><h2 id="titulo-pagamento-pedido">Pagamento demonstrativo</h2><PaymentSummary method={pedido.metodo_pagamento} status={pedido.status_pagamento} /></section>
          <ResumoPedido itens={pedido.itens} total={Number(pedido.total)} subtotal={pedido.subtotal_produtos == null ? undefined : Number(pedido.subtotal_produtos)} frete={pedido.frete == null ? undefined : Number(pedido.frete)} confirmado />
        </>
      )}
      <div className="checkout-actions">
        <Link className="pill primary" to="/minha-conta">Minha Conta</Link>
        <Link className="pill" to="/loja">Voltar para a Loja</Link>
      </div>
    </div>
  );
}

export default function PedidoConfirmado() {
  const { user } = useSessao();
  const { id } = useParams();
  return <DetalhesPedido key={`${user.id}:${id}`} usuarioId={user.id} id={id} />;
}
