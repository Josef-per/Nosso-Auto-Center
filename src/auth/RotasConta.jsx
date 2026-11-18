import { Navigate, Outlet } from 'react-router-dom';
import { useSessao } from './useSessao';

function AguardeSessao() {
  return <p className="container route-status" role="status">Verificando sessão…</p>;
}

export function RotaProtegida() {
  const session = useSessao();
  if (session === undefined) return <AguardeSessao />;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RotaVisitante() {
  const session = useSessao();
  if (session === undefined) return <AguardeSessao />;
  return session ? <Navigate to="/minha-conta" replace /> : <Outlet />;
}
