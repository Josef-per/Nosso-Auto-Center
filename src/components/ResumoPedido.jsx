import { formatarPreco } from '../lib/formatarPreco';

export default function ResumoPedido({ itens, total, subtotal, frete, confirmado = false }) {
  return (
    <section className="panel pedido-resumo" aria-labelledby="titulo-resumo-pedido">
      <h2 id="titulo-resumo-pedido">{confirmado ? 'Itens do pedido' : 'Resumo do pedido'}</h2>
      <ul className="pedido-linhas">
        {itens.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.nome}</strong>
              <small className="text-muted">{item.quantidade} × {formatarPreco(item.precoUnitario)}</small>
            </div>
            <span aria-label={`Subtotal: ${formatarPreco(item.subtotal)}`}>{formatarPreco(item.subtotal)}</span>
          </li>
        ))}
      </ul>
      {subtotal != null && <div className="summary-line"><span>Subtotal dos produtos</span><span>{formatarPreco(subtotal)}</span></div>}
      {frete !== undefined && <div className="summary-line"><span>Frete demonstrativo</span><span>{frete === null ? 'A calcular' : formatarPreco(frete)}</span></div>}
      <div className="summary-line total">
        <span>{confirmado ? 'Total registrado' : 'Total estimado'}</span>
        <strong>{!confirmado && frete === null ? 'Informe o CEP' : formatarPreco(total)}</strong>
      </div>
      {!confirmado && <p className="text-muted">O total é calculado pelo Supabase ao confirmar o pedido.</p>}
    </section>
  );
}
