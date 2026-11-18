import { useEffect, useState } from 'react';
import { observarSessao } from '../services/contaService';
import { SessaoContext } from './useSessao';

export default function SessaoProvider({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => observarSessao(setSession), []);

  return (
    <SessaoContext.Provider value={session}>
      {children}
    </SessaoContext.Provider>
  );
}
