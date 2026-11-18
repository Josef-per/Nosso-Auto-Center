import { Marca, LinksNavegacao } from './Navegacao';
export default function Footer() {
  return (
    <footer className="footer site-footer">
      <div className="container">
        <div className="footergrid">
          <div><Marca /><p className="footer-description">Autopeças e cuidado para o seu próximo caminho.</p></div>
          <nav aria-label="Navegação do rodapé">
            <LinksNavegacao />
          </nav>
        </div>
        <div className="foot-bottom">© {new Date().getFullYear()} Nosso Auto Center</div>
      </div>
    </footer>
  );
}
