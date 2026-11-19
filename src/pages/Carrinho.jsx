import ProductImage from '../components/ProductImage';
import { ShoppingBag, Truck, ArrowRight } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSessao } from '../auth/useSessao';
import { subtotalItem, totalCarrinho } from '../carrinho/resumoCarrinho';
import { quantidadeDoProduto, useCarrinho } from '../carrinho/useCarrinho';
import CampoQuantidade from '../components/CampoQuantidade';
import { formatarPreco } from '../lib/formatarPreco';

function ItemCarrinho({ item, informar }) {
  const { itens, gravando, alterar } = useCarrinho();
  const [rascunho, setRascunho] = useState(null);
  const [erroQuantidade, setErroQuantidade] = useState('');
  const erroId = useId();
  const operando = useRef(false);
  const removendo = useRef(false);
  const { produto } = item;
  const nome = produto?.name ?? 'Produto indisponível';
  const outrasUnidades = quantidadeDoProduto(itens, item.produtoId) - item.quantidade;
  const limite = Math.max(0, Math.min(99, (produto?.stock ?? 0) - outrasUnidades));
  const quantidade = Number(rascunho ?? item.quantidade);
  const quantidadeValida = Number.isSafeInteger(quantidade) && quantidade >= 1 && quantidade <= limite;

  async function modificar(acao) {
    if (operando.current || gravando) return;
    if (acao === 'atualizar' && !quantidadeValida) {
      setRascunho(null);
      setErroQuantidade('Informe uma quantidade inteira entre 1 e ' + limite + '. O valor confirmado foi restaurado.');
      return;
    }
    if (acao === 'atualizar' && quantidade === item.quantidade) { setRascunho(null); return; }
    operando.current = true;
    setErroQuantidade('');
    informar(null);
    try {
      await alterar({ acao, id: item.id, quantidade });
      setRascunho(null);
      informar({ texto: acao === 'remover' ? 'Item removido.' : 'Quantidade atualizada.' });
    } catch (error) {
      setRascunho(null);
      informar({ erro: error.message + (acao === 'atualizar' ? ' O último valor confirmado foi restaurado. Recarregue o carrinho para conferir.' : '') });
    } finally {
      operando.current = false;
    }
  }

  return (
    <li className="cart-item cart-line">
      {produto && (
        <Link className="cart-photo" to={`/produto/${produto.id}`} tabIndex={-1} aria-hidden="true">
          <ProductImage src={produto.image} alt="" />
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
          <div>
            <CampoQuantidade
              quantidade={rascunho ?? item.quantidade} limite={limite}
              onChange={(valor) => { setRascunho(valor); setErroQuantidade(''); }}
              onBlur={(event) => {
                if (removendo.current || event.relatedTarget?.closest('[data-remover-item]')) { setRascunho(null); return; }
                modificar('atualizar');
              }}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}
              ariaLabel={`Quantidade de ${nome}`} disabled={gravando}
              invalid={Boolean(erroQuantidade)} describedBy={erroQuantidade ? erroId : undefined}
            />
            {erroQuantidade && <p id={erroId} className="field-error" role="alert">{erroQuantidade}</p>}
          </div>
        ) : <p>Quantidade: {item.quantidade}</p>}
        <button
          className="cart-remove"
          data-remover-item="true"
          type="button"
          disabled={gravando}
          aria-label={`Remover ${nome}`}
          onPointerDown={() => { removendo.current = true; }}
          onPointerCancel={() => { removendo.current = false; }}
          onPointerLeave={() => { removendo.current = false; }}
          onClick={() => { removendo.current = false; modificar('remover'); }}
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
        <nav className="crumb" aria-label="Localização"><Link to="/loja">Loja</Link> / Carrinho</nav><p className="eyebrow">SUAS ESCOLHAS, EM UM SÓ LUGAR</p><h1>Seu carrinho.</h1>
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
            <p className="summary-note"><Truck size={17} aria-hidden="true" />Frete demonstrativo calculado por CEP na próxima etapa.</p>
            {itens.some((item) => !item.produto) && (
              <p className="text-muted">Itens que saíram do catálogo ficam fora do total.</p>
            )}
            <div className="checkout-actions">
              <button className="pill primary" type="button" disabled={gravando} onClick={() => navigate('/checkout')}>
                Finalizar compra <ArrowRight size={17} aria-hidden="true" />
              </button>
              <Link className="account-link" to="/loja">Continuar comprando</Link>
            </div>
          </section>
        </div>
      ) : (
        <section className="empty commerce-empty">
          <ShoppingBag size={42} strokeWidth={1.3} aria-hidden="true" />
          <h2>Seu carrinho está vazio</h2>
          <div className="checkout-actions checkout-empty-actions">
            <Link className="pill primary" to="/loja">Explorar produtos <ArrowRight size={17} aria-hidden="true" /></Link>
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
