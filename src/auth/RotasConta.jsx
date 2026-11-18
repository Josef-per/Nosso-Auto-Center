import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { caminhoAcesso, destinoAposAcesso } from './destinoAcesso';
import { useSessao } from './useSessao';

function AguardeSessao() {
  return <p className="container route-status" role="status">Verificando sessão…</p>;
}

export function RotaProtegida() {
  const session = useSessao();
  const { pathname } = useLocation();
  if (session === undefined) return <AguardeSessao />;
  const destino = destinoAposAcesso(new URLSearchParams({ continuar: pathname }));
  return session ? <Outlet /> : <Navigate to={caminhoAcesso('/login', destino)} replace />;
}

export function RotaVisitante() {
  const session = useSessao();
  const { search } = useLocation();
  if (session === undefined) return <AguardeSessao />;
  return session ? <Navigate to={destinoAposAcesso(search)} replace /> : <Outlet />;
}
