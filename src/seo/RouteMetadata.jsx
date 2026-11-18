import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { aplicarMetadados, metadadosDaRota } from './metadados';
export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => { aplicarMetadados(metadadosDaRota(pathname)); }, [pathname]);
  return null;
}
