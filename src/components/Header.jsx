import { useLayoutEffect, useRef, useState } from 'react';
import { MapPin, Menu, Phone, ShoppingCart, UserRound, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useSessao } from '../auth/useSessao';
import { useCarrinho } from '../carrinho/useCarrinho';
import { Marca, LinksNavegacao } from './Navegacao';
import ThemeToggle from './ThemeToggle';
export default function Header() {
  const session = useSessao();
  const { itens } = useCarrinho();
  const quantidade = itens.reduce((total, item) => total + item.quantidade, 0);
  const [menuAberto, setMenuAberto] = useState(false);
  const botaoMenu = useRef(null);
  const header = useRef(null);
  const conta = session === null ? '/login' : '/minha-conta';
  const fecharMenu = () => setMenuAberto(false);

  useLayoutEffect(() => {
    const element = header.current;
    const layout = element.parentElement;
    const atualizarAltura = () => {
      if (element.isConnected) layout.style.setProperty('--header-height', `${element.getBoundingClientRect().height}px`);
    };
    atualizarAltura();
    const observer = new ResizeObserver(atualizarAltura);
    observer.observe(element);
    return () => observer.disconnect();
  }, [menuAberto]);

  function tratarTecla(event) {
    if (event.key === 'Escape' && menuAberto) {
      fecharMenu();
      botaoMenu.current.focus();
    }
  }

  return (
    <header ref={header} className="header site-header" onKeyDown={tratarTecla}>
      <div className="header-top"><div className="container"><span><MapPin size={13} aria-hidden="true" />Autopeças & oficina em Franca · SP</span><a href="tel:+551634328200"><Phone size={13} aria-hidden="true" />(16) 3432-8200</a></div></div>
      <div className="container header-inner">
        <Marca />
        <nav className="nav" aria-label="Navegação principal">
          <LinksNavegacao />
        </nav>
        <div className="right">
          <ThemeToggle />
          <NavLink to={conta} className="iconbtn header-account" aria-label={session === null ? 'Entrar' : 'Minha conta'}>
            <UserRound size={21} aria-hidden="true" />
            <span className="header-action-label">{session === null ? 'Entrar' : 'Minha conta'}</span>
          </NavLink>
          <NavLink
            to="/carrinho"
            className="iconbtn header-cart"
            aria-label={quantidade ? `Carrinho, ${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'}` : 'Carrinho'}
          >
            <ShoppingCart size={21} aria-hidden="true" />
            <span className="header-action-label">Carrinho</span>
            {quantidade > 0 && <span className="count cart-count" aria-hidden="true">{quantidade}</span>}
          </NavLink>
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
