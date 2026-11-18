import { QrCode, Barcode, CreditCard } from 'lucide-react';
const opcoes = [
  { value: 'pix', title: 'Pix', description: 'Somente registro da escolha. Nenhum QR Code de cobrança será gerado.', icon: <QrCode size={24} aria-hidden="true" /> },
  { value: 'boleto', title: 'Boleto bancário', description: 'Simulação acadêmica. Nenhum boleto será emitido.', icon: <Barcode size={24} aria-hidden="true" /> },
  { value: 'cartao_credito', title: 'Cartão de crédito', description: 'Não solicitamos número de cartão ou CVV. Nenhum valor será cobrado.', icon: <CreditCard size={24} aria-hidden="true" /> },
];
export default function PaymentOptions({ value, onChange }) {
  return <fieldset className="payment-options">
    <legend>Pagamento demonstrativo</legend>
    <p className="text-muted">Selecione uma modalidade. O pagamento será registrado como simulado, sem processamento.</p>
    {opcoes.map((opcao) => <label className={value === opcao.value ? 'payment-option selected' : 'payment-option'} key={opcao.value}>
      <input type="radio" name="pagamento" value={opcao.value} checked={value === opcao.value} onChange={() => onChange(opcao.value)} required />
      {opcao.icon}<span><strong>{opcao.title}</strong><small>{opcao.description}</small></span>
    </label>)}
  </fieldset>;
}
