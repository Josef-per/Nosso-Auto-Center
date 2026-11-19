import RouteMetadata from '../seo/RouteMetadata';
import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import LoadingState from './LoadingState';
import RouteErrorBoundary from './RouteErrorBoundary';
export default function Layout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // A Home posiciona Serviços uma única vez, após estabilizar o catálogo.
    if (pathname === '/' && hash === '#servicos') return;
    const destino = document.getElementById(hash.slice(1));
    if (destino) {
      destino.focus({ preventScroll: true });
      destino.scrollIntoView({ block: 'start' });
      return;
    }
    // Trocas de página começam no topo; somente as âncoras usam o scroll suave do CSS.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return (
    <div className="site-layout">
      <RouteMetadata />
      <a className="site-skip" href="#conteudo">Ir para o conteúdo</a>
      <Header key={pathname + hash} />
      <main id="conteudo" tabIndex={-1}>
        <RouteErrorBoundary key={pathname}><Suspense fallback={<LoadingState message="Carregando página…" />}>
          <Outlet />
        </Suspense></RouteErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
