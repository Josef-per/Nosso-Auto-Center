import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { verificarAdmin } from '../services/adminService';

// A visibilidade usa a mesma RPC da rota. A rota e o banco seguem protegidos.
export default function AdminEntry({ usuarioId }) {
  const [permitido, setPermitido] = useState(false);
  useEffect(() => {
    let ativo = true;
    verificarAdmin().then((valor) => { if (ativo) setPermitido(valor === true); }, () => { if (ativo) setPermitido(false); });
    return () => { ativo = false; };
  }, [usuarioId]);
  return permitido ? <Link className="admin-entry" to="/admin"><ShieldCheck size={17} aria-hidden="true" />Área administrativa</Link> : null;
}
