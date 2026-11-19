import { Link, NavLink, useLocation } from 'react-router-dom';
export function Marca() {
  return (
    <Link to="/" className="brand site-brand" aria-label="Nosso Auto Center — início">
      <img className="brand-logo" src="/images/empresa/logo-marca.png" width="76" height="64" alt="" decoding="async" />
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
        Início
      </Link>
      <NavLink to="/loja" onClick={onClick}>Loja</NavLink>
      <Link to="/#servicos" onClick={onClick} aria-current={emServicos ? 'location' : undefined}>
        Serviços
      </Link>
      <NavLink to="/sobre" onClick={onClick}>Sobre nós</NavLink>
    </>
  );
}
