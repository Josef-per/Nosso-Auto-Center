import { modalidadesDemonstrativas } from '../lib/pagamentoDemonstrativo';
export default function PaymentSummary({ method, status }) {
  const modalidade = Object.hasOwn(modalidadesDemonstrativas, method) ? modalidadesDemonstrativas[method] : null;
  return <div className="payment-summary">
    <p><strong>Forma de pagamento:</strong> {modalidade?.nome ?? 'Não registrada ou não reconhecida neste pedido'}</p>
    <p><strong>Status financeiro:</strong> {status === 'simulado' ? 'Simulado — não processado' : 'Não registrado como simulado'}</p>
    {status === 'simulado' && modalidade && <p className="text-muted">{modalidade.mensagem}</p>}
  </div>;
}
