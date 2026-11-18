import { LoaderCircle } from 'lucide-react';
export default function LoadingState({ message = 'Carregando produtos…' }) {
  return <div className="state-panel" role="status"><LoaderCircle className="loading-icon" size={28} aria-hidden="true" /><p>{message}</p></div>;
}
