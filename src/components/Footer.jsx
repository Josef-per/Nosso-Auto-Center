import { ArrowUpRight, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Marca } from './Navegacao';
import { empresa } from '../content/empresa';
export default function Footer() {
  return (
    <footer className="footer site-footer">
      <div className="container">
        <div className="footer-intro"><span>PEÇAS. CUIDADO. PRÓXIMOS CAMINHOS.</span><Link to="/loja">Encontre a próxima peça<ArrowUpRight size={22} aria-hidden="true" /></Link></div>
        <div className="footergrid">
          <div><Marca /><p className="footer-description">Da peça certa ao cuidado na oficina.<br />Nosso Auto Center, em Franca.</p></div>
          <nav aria-label="Navegação do rodapé"><h2>Explore</h2><Link to="/loja">Loja de autopeças</Link><Link to="/#servicos">Serviços</Link><Link to="/sobre">Sobre nós</Link><Link to="/minha-conta">Minha conta</Link></nav>
          <div className="footer-contact"><h2>Encontre a gente</h2><p><MapPin size={16} aria-hidden="true" /><span>{empresa.endereco}<br />{empresa.cidade}</span></p><a href="tel:+551634328200"><Phone size={16} aria-hidden="true" />{empresa.telefone}</a><a href="tel:+5516992628548"><Phone size={16} aria-hidden="true" />{empresa.celular}</a><a href={`mailto:${empresa.email}`}><Mail size={16} aria-hidden="true" />{empresa.email}</a></div>
        </div>
        <div className="foot-bottom"><span>© {new Date().getFullYear()} Nosso Auto Center</span><span>Loja acadêmica · pedidos, frete e pagamentos demonstrativos.</span></div>
      </div>
    </footer>
  );
}
