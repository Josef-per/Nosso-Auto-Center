import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSessao } from '../auth/useSessao';
import { subtotalItem, totalCarrinho } from '../carrinho/resumoCarrinho';
import { quantidadeDoProduto, useCarrinho } from '../carrinho/useCarrinho';
import CampoQuantidade from '../components/CampoQuantidade';
import { formatarPreco } from '../lib/formatarPreco';

function ItemCarrinho({ item, informar }) {
  const { itens, gravando, alterar } = useCarrinho();
  const [rascunho, setRascunho] = useState(null);
  const { produto } = item;
  const nome = produto?.name ?? 'Produto indisponível';
  const outrasUnidades = quantidadeDoProduto(itens, item.produtoId) - item.quantidade;
  const limite = Math.max(0, (produto?.stock ?? 0) - outrasUnidades);
  const quantidade = Number(rascunho ?? item.quantidade);
  const quantidadeValida = Number.isSafeInteger(quantidade) && quantidade >= 1 && quantidade <= limite;

  async function modificar(acao) {
    informar(null);
    try {
      await alterar({ acao, id: item.id, quantidade });
      setRascunho(null);
      informar({ texto: acao === 'remover' ? 'Item removido.' : 'Quantidade atualizada.' });
    } catch (error) {
      informar({ erro: error.message });
    }
  }

  return (
    <li className="cart-item cart-line">
      {produto && (
        <Link className="cart-photo" to={`/produto/${produto.id}`} tabIndex={-1} aria-hidden="true">
          <img src={produto.image} alt="" />
        </Link>
      )}
      <div className="cart-product-info">
        <h2>{produto ? <Link to={`/produto/${produto.id}`}>{nome}</Link> : nome}</h2>
        {produto?.brand && <small>{produto.brand}</small>}
        {produto && <p>{formatarPreco(produto.price)} por unidade</p>}
        {item.quantidade > limite && (
          <p className="cart-stock-warning">
            {limite > 0 ? `Ajuste a quantidade para até ${limite}.` : 'Remova este item para corrigir a disponibilidade.'}
          </p>
        )}
      </div>
      <div className="cart-line-actions">
        {limite > 0 ? (
          <form onSubmit={(event) => {
            event.preventDefault();
            if (quantidadeValida && quantidade !== item.quantidade) modificar('atualizar');
          }}>
            <CampoQuantidade
              quantidade={rascunho ?? item.quantidade}
              limite={limite}
              onChange={setRascunho}
              ariaLabel={`Quantidade de ${nome}`}
              disabled={gravando}
            />
            <button
              className="pill"
              type="submit"
              disabled={gravando || !quantidadeValida || quantidade === item.quantidade}
              aria-label={`Atualizar quantidade de ${nome}`}
            >
              Atualizar
            </button>
          </form>
        ) : <p>Quantidade: {item.quantidade}</p>}
        <button
          className="cart-remove"
          type="button"
          disabled={gravando}
          aria-label={`Remover ${nome}`}
          onClick={() => modificar('remover')}
        >
          Remover
        </button>
      </div>
      {produto && <p className="cart-line-total">{formatarPreco(subtotalItem(item) / 100)}</p>}
    </li>
  );
}

function ConteudoCarrinho({ visitante }) {
  const { itens, carregando, erro, gravando, recarregar } = useCarrinho();
  const navigate = useNavigate();
  const [retorno, setRetorno] = useState(null);
  const subtotal = totalCarrinho(itens);

  return (
    <div className="container cart-page">
      <div className="page-heading">
        <h1>Carrinho</h1>
        {visitante && !carregando && (
          <p className="text-muted">O carrinho de visitante fica neste navegador, separado do carrinho da conta.</p>
        )}
      </div>
      {carregando && <p role="status">Carregando carrinho…</p>}
      {(erro || retorno?.erro) && (
        <div className="cart-error">
          <p className="notice" role="alert">{erro ?? retorno.erro}</p>
          <button
            className="pill"
            type="button"
            onClick={() => {
              setRetorno(null);
              recarregar();
            }}
            disabled={gravando}
          >
            Recarregar carrinho
          </button>
        </div>
      )}
      {retorno?.texto && <p className="cart-feedback" role="status">{retorno.texto}</p>}
      {gravando && <p className="cart-feedback" role="status">Salvando carrinho…</p>}
      {!carregando && !erro && (itens.length ? (
        <div className="cart-layout">
          <ul className="cart-lines" aria-label="Itens do carrinho">
            {itens.map((item) => <ItemCarrinho key={item.id} item={item} informar={setRetorno} />)}
          </ul>
          <section className="panel cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">Resumo do pedido</h2>
            <div className="summary-line"><span>Subtotal</span><span>{formatarPreco(subtotal)}</span></div>
            <div className="summary-line total"><span>Total</span><span>{formatarPreco(subtotal)}</span></div>
            {itens.some((item) => !item.produto) && (
              <p className="text-muted">Itens que saíram do catálogo ficam fora do total.</p>
            )}
            <div className="checkout-actions">
              <button className="pill primary" type="button" disabled={gravando} onClick={() => navigate('/checkout')}>
                Finalizar compra
              </button>
              <Link className="account-link" to="/loja">Continuar comprando</Link>
            </div>
          </section>
        </div>
      ) : (
        <section className="empty commerce-empty">
          <h2>Seu carrinho está vazio</h2>
          <div className="checkout-actions checkout-empty-actions">
            <button className="pill primary" type="button" disabled>Finalizar compra</button>
            <Link className="account-link" to="/loja">Explorar produtos</Link>
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Carrinho() {
  const sessao = useSessao();
  return <ConteudoCarrinho key={sessao?.user.id ?? 'visitante'} visitante={sessao === null} />;
}
