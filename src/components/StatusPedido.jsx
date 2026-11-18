export default function StatusPedido({ status }) {
  const texto = status.replaceAll('_', ' ');
  return <span className="pedido-status">{texto.charAt(0).toUpperCase() + texto.slice(1)}</span>;
}
