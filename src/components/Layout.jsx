import RouteMetadata from '../seo/RouteMetadata';
import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import LoadingState from './LoadingState';
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
      <RouteMetadata />
      <a className="site-skip" href="#conteudo">Ir para o conteúdo</a>
      <Header key={pathname + hash + key} />
      <main id="conteudo" tabIndex={-1}>
        <Suspense fallback={<LoadingState message="Carregando página…" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
