import { createContext, useContext } from 'react';

export const SessaoContext = createContext(null);

export function useSessao() {
  return useContext(SessaoContext);
}
