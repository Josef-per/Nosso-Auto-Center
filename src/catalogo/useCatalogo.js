import { useEffect, useState } from 'react';
import { listarProdutos } from '../services/produtoService';

export function useCatalogo() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    listarProdutos().then(
      (data) => { if (active) setProducts(data); },
      () => { if (active) setError('Verifique sua conexão e tente novamente.'); },
    ).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  function retry() {
    setLoading(true);
    setError('');
    setAttempt((value) => value + 1);
  }
  return { products, loading, error, retry };
}
