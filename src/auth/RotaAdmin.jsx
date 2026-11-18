import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { verificarAdmin } from '../services/adminService';
import { useSessao } from './useSessao';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
function Permissao({ usuarioId }) {
  const [estado, setEstado] = useState('carregando');
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    verificarAdmin().then((admin) => { if (ativo) setEstado(admin === true ? 'permitido' : 'negado'); },
      () => { if (ativo) setEstado('erro'); });
    return () => { ativo = false; };
  }, [usuarioId, tentativa]);
  if (estado === 'carregando') return <LoadingState message="Verificando permissão administrativa…" />;
  if (estado === 'erro') return <ErrorState title="Não foi possível verificar a permissão" onRetry={() => { setEstado('carregando'); setTentativa((n) => n + 1); }} />;
  if (estado === 'negado') return <section className="container route-status"><h1>Acesso restrito</h1><p>Esta área está disponível apenas para administradores.</p><Link className="pill" to="/minha-conta">Voltar à minha conta</Link></section>;
  return <Outlet />;
}
export default function RotaAdmin() {
  const { user } = useSessao();
  return <Permissao key={user.id} usuarioId={user.id} />;
}
