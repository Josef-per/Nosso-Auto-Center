import { PackageOpen } from 'lucide-react';
export default function EmptyState({ title = 'Nenhum produto encontrado', message, children }) {
  return <section className="state-panel"><PackageOpen size={34} aria-hidden="true" /><h2>{title}</h2>{message && <p>{message}</p>}{children}</section>;
}
