import { CircleAlert } from 'lucide-react';
export default function ErrorState({ title = 'Não foi possível carregar os produtos', message, onRetry }) {
  return <div className="state-panel state-error" role="alert"><CircleAlert size={30} aria-hidden="true" /><h2>{title}</h2><p>{message || 'Verifique sua conexão e tente novamente.'}</p>{onRetry && <button className="pill" type="button" onClick={onRetry}>Tentar novamente</button>}</div>;
}
