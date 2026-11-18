import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessao } from '../auth/useSessao';
import { quantidadeDoProduto, useCarrinho } from '../carrinho/useCarrinho';

export default function AdicionarAoCarrinho({ produto, quantidade = 1, destaque = false }) {
  const { itens, carregando, erro, gravando, alterar } = useCarrinho();
  const usuarioId = useSessao()?.user.id ?? null;
  const [retorno, setRetorno] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const quantidadeAtual = quantidadeDoProduto(itens, produto.id);
  const limite = produto.stock - quantidadeAtual;
  const disponivel = Number.isSafeInteger(quantidade) && quantidade >= 1 && quantidade <= limite;
  let rotulo = 'Adicionar ao carrinho';
  if (adicionando) rotulo = 'Adicionando…';
  else if (produto.stock === 0) rotulo = 'Sem estoque';
  else if (limite <= 0) rotulo = 'Limite no carrinho';

  async function adicionar() {
    setAdicionando(true);
    setRetorno(null);
    try {
      const atualizados = await alterar({ acao: 'adicionar', id: String(produto.id), quantidade });
      setRetorno({ usuarioId, quantidadeFinal: quantidadeDoProduto(atualizados, produto.id) });
    } catch (error) {
      setRetorno({ usuarioId, erro: error.message, quantidadeFinal: quantidadeAtual });
    } finally {
      setAdicionando(false);
    }
  }

  const mensagem = retorno?.usuarioId === usuarioId && retorno.quantidadeFinal === quantidadeAtual ? retorno : null;

  return (
    <div className="cart-add">
      <button
        className={destaque ? 'pill primary' : 'pill'}
        type="button"
        disabled={!disponivel || carregando || Boolean(erro) || gravando}
        onClick={adicionar}
      >
        {rotulo}
      </button>
      {mensagem?.erro && <p className="notice" role="alert">{mensagem.erro}</p>}
      {erro && produto.stock > 0 && (
        <p className="cart-feedback"><Link to="/carrinho">Ver status do carrinho</Link></p>
      )}
      {mensagem && !mensagem.erro && (
        <p className="cart-feedback" role="status">Adicionado. <Link to="/carrinho">Ver carrinho</Link></p>
      )}
    </div>
  );
}
