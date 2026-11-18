import { Link } from 'react-router-dom';

export default function NaoEncontrada() {
  return (
    <div className="container">
      <section className="empty missing-page">
        <p className="eyebrow">Erro 404</p>
        <h1>Página não encontrada</h1>
        <p className="text-muted">O endereço pode ter mudado ou sido digitado incorretamente.</p>
        <Link className="pill primary" to="/">Voltar para a Home</Link>
      </section>
    </div>
  );
}
