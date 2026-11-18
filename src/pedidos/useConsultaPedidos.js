import { useEffect, useState } from 'react';

export function useConsultaPedidos(consultar, usuarioId, pedidoId) {
  const [resultado, setResultado] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    consultar(usuarioId, pedidoId).then(
      (dados) => { if (ativo) setResultado({ dados }); },
      () => { if (ativo) setResultado({ erro: true }); },
    );
    return () => { ativo = false; };
  }, [consultar, usuarioId, pedidoId, tentativa]);

  return {
    dados: resultado?.dados,
    carregando: resultado === null,
    erro: resultado?.erro,
    recarregar() {
      setResultado(null);
      setTentativa((valor) => valor + 1);
    },
  };
}
