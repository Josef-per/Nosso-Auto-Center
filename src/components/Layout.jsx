import { useEffect, useRef, useState } from 'react';
import { Gauge, Menu, ShoppingCart, UserRound, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSessao } from '../auth/useSessao';

function Marca() {
  return (
    <Link to="/" className="brand site-brand">
      <span className="brand-mark" aria-hidden="true"><Gauge size={23} /></span>
      <span className="brand-name">Nosso Auto Center<small>AUTOPEÇAS &amp; OFICINA</small></span>
    </Link>
  );
}

function LinksNavegacao({ onClick }) {
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

function Header() {
  const session = useSessao();
  const [menuAberto, setMenuAberto] = useState(false);
  const botaoMenu = useRef(null);
  const conta = session === null ? '/login' : '/minha-conta';
  const fecharMenu = () => setMenuAberto(false);

  function tratarTecla(event) {
    if (event.key === 'Escape' && menuAberto) {
      fecharMenu();
      botaoMenu.current.focus();
    }
  }

  return (
    <header className="header site-header" onKeyDown={tratarTecla}>
      <div className="container header-inner">
        <Marca />
        <nav className="nav" aria-label="Navegação principal">
          <LinksNavegacao />
        </nav>
        <div className="right">
          <NavLink to={conta} className="iconbtn" aria-label={session === null ? 'Entrar' : 'Minha conta'}>
            <UserRound size={21} aria-hidden="true" />
          </NavLink>
          <button
            className="iconbtn"
            type="button"
            aria-label="Carrinho"
            onClick={() => window.alert('Carrinho será integrado na próxima etapa!')}
          >
            <ShoppingCart size={21} aria-hidden="true" />
          </button>
          <button
            ref={botaoMenu}
            className="iconbtn mobile-menu"
            type="button"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            aria-controls="nav-mobile"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            {menuAberto ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <nav id="nav-mobile" className="container site-mobile-nav" aria-label="Navegação móvel" hidden={!menuAberto}>
        <LinksNavegacao onClick={fecharMenu} />
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer site-footer">
      <div className="container">
        <div className="footergrid">
          <Marca />
          <nav aria-label="Navegação do rodapé">
            <LinksNavegacao />
          </nav>
        </div>
        <div className="foot-bottom">© {new Date().getFullYear()} Nosso Auto Center</div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    const destino = document.getElementById(hash.slice(1));
    if (destino) {
      destino.focus({ preventScroll: true });
      destino.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, key]);

  return (
    <div className="site-layout">
      <a className="site-skip" href="#conteudo">Ir para o conteúdo</a>
      <Header key={pathname + hash + key} />
      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
