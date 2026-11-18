import { Truck } from 'lucide-react';
import { formatarPreco } from '../lib/formatarPreco';
export default function ShippingEstimate({ value }) {
  return <div className="shipping-estimate" role="status"><Truck size={22} aria-hidden="true" /><div>
    <strong>{value === null ? 'Informe um CEP para estimar o frete' : 'Frete demonstrativo: ' + formatarPreco(value)}</strong>
    <small>Valores simulados: SP R$ 15,00 · demais estados do Sudeste R$ 25,00 · outras regiões R$ 39,90. Recalculado pelo CEP no banco.</small>
  </div></div>;
}
