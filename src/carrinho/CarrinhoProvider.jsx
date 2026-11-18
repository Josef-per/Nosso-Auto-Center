import { useEffect, useMemo, useRef, useState } from 'react';
import { useSessao } from '../auth/useSessao';
import { alterarCarrinho, carregarCarrinho } from '../services/carrinhoService';
import { CarrinhoContext } from './useCarrinho';

export default function CarrinhoProvider({ children }) {
  const sessao = useSessao();
  const usuarioId = sessao === null ? null : sessao?.user.id;
  const [tentativa, setTentativa] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [gravando, setGravando] = useState(false);
  const bloqueio = useRef(false);
  const consulta = useMemo(() => ({ usuarioId, tentativa }), [usuarioId, tentativa]);

  useEffect(() => {
    if (consulta.usuarioId === undefined) return;

    let ativo = true;
    carregarCarrinho(consulta.usuarioId).then(
      (itens) => { if (ativo) setResultado({ consulta, itens }); },
      () => { if (ativo) setResultado({ consulta, erro: 'Não foi possível carregar o carrinho.' }); },
    );
    return () => { ativo = false; };
  }, [consulta]);

  const atual = resultado?.consulta === consulta ? resultado : null;
  const itens = atual?.itens ?? [];

  async function alterar(operacao) {
    if (!atual?.itens || bloqueio.current) {
      throw new Error('Aguarde o carrinho ficar disponível e tente novamente.');
    }

    bloqueio.current = true;
    setGravando(true);
    try {
      const itens = await alterarCarrinho(consulta.usuarioId, operacao);
      setResultado((anterior) => anterior?.consulta === consulta ? { consulta, itens } : anterior);
      return itens;
    } finally {
      bloqueio.current = false;
      setGravando(false);
    }
  }

  return (
    <CarrinhoContext.Provider value={{
      itens,
      carregando: !atual,
      erro: atual?.erro,
      gravando,
      alterar,
      recarregar: () => setTentativa((valor) => valor + 1),
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}
