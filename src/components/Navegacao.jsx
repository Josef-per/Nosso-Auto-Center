import { Gauge } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
export function Marca() {
  return (
    <Link to="/" className="brand site-brand">
      <span className="brand-mark" aria-hidden="true"><Gauge size={23} /></span>
      <span className="brand-name">Nosso Auto Center<small>AUTOPEÇAS &amp; OFICINA</small></span>
    </Link>
  );
}

export function LinksNavegacao({ onClick }) {
  const { pathname, hash } = useLocation();
  const emServicos = pathname === '/' && hash === '#servicos';

  return (
    <>
      <Link to="/" onClick={onClick} aria-current={pathname === '/' && !emServicos ? 'page' : undefined}>
        Home
      </Link>
      <NavLink to="/loja" onClick={onClick}>Loja</NavLink>
      <Link to="/#servicos" onClick={onClick} aria-current={emServicos ? 'location' : undefined}>
        Serviços
      </Link>
    </>
  );
}
