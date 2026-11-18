import { Link, useLocation } from 'react-router-dom';
import { formatarPreco } from '../lib/formatarPreco';
import { useConsultaPedidos } from '../pedidos/useConsultaPedidos';
import { listarPedidos } from '../services/pedidoService';
import StatusPedido from './StatusPedido';

const dataPedido = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function MeusPedidos({ usuarioId }) {
  const { state } = useLocation();
  const { dados: pedidos, carregando, erro, recarregar } = useConsultaPedidos(listarPedidos, usuarioId);

  return (
    <section id="meus-pedidos" className="panel meus-pedidos" aria-labelledby="titulo-meus-pedidos" tabIndex={-1}>
      <h2 id="titulo-meus-pedidos">Meus Pedidos</h2>
      {carregando && <p role="status">Carregando pedidos…</p>}
      {erro && (
        <>
          <p className="notice" role="alert">Não foi possível carregar seus pedidos.</p>
          <button className="pill" type="button" onClick={recarregar}>Tentar novamente</button>
        </>
      )}
      {pedidos?.length === 0 && <p className="text-muted">Você ainda não tem pedidos.</p>}
      {pedidos?.length > 0 && (
        <ul className="pedido-linhas">
          {pedidos.map((pedido) => (
            <li key={pedido.id}>
              <div>
                <Link className="account-link pedido-id" to={`/pedido-confirmado/${pedido.id}`}>
                  Pedido {pedido.id}
                </Link>
                <small className="text-muted">
                  <time dateTime={pedido.criado_em}>{dataPedido.format(new Date(pedido.criado_em))}</time>
                </small>
              </div>
              <div className="pedido-meta">
                <StatusPedido status={pedido.status} />
                <strong>{formatarPreco(Number(pedido.total))}</strong>
              </div>
            </li>
          ))}
        </ul>
      )}
      {state?.voltarAoCheckout && (
        <div className="checkout-actions">
          <Link className="account-link" to="/checkout">Voltar ao checkout</Link>
        </div>
      )}
    </section>
  );
}
