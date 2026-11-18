import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSessao } from '../auth/useSessao';
import { subtotalItem, totalCarrinho } from '../carrinho/resumoCarrinho';
import { quantidadeDoProduto, useCarrinho } from '../carrinho/useCarrinho';
import ResumoPedido from '../components/ResumoPedido';
import { estados, validarEndereco } from '../lib/enderecoEntrega';
import { finalizarPedido, liberarNovoEnvio, pedidoAConferir } from '../services/pedidoService';

const campos = [
  { nome: 'cep', rotulo: 'CEP', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 9 },
  { nome: 'logradouro', rotulo: 'Logradouro', autoComplete: 'address-line1' },
  { nome: 'numero', rotulo: 'Número' },
  { nome: 'bairro', rotulo: 'Bairro (opcional)', autoComplete: 'address-level3', opcional: true },
  { nome: 'complemento', rotulo: 'Complemento (opcional)', autoComplete: 'address-line2', opcional: true },
  { nome: 'cidade', rotulo: 'Cidade', autoComplete: 'address-level2' },
];

function Endereco({ onSubmit, erroCampo, enviando, bloqueado, endereco }) {
  return (
    <section className="panel" aria-labelledby="titulo-endereco">
      <h2 id="titulo-endereco">Endereço de entrega</h2>
      <form className="checkout-form" onSubmit={onSubmit} noValidate>
        <fieldset disabled={enviando}>
          <div className="checkout-fields">
            {campos.map(({ nome, rotulo, opcional, ...atributos }) => (
              <div key={nome} className={nome === 'logradouro' || nome === 'complemento' ? 'checkout-wide' : undefined}>
                <label className="field" htmlFor={`entrega-${nome}`}>{rotulo}</label>
                <input
                  id={`entrega-${nome}`}
                  name={nome}
                  className="forminput"
                  defaultValue={endereco?.[nome] ?? ''}
                  required={!opcional}
                  aria-invalid={erroCampo?.campo === nome || undefined}
                  aria-describedby={erroCampo?.campo === nome ? 'erro-endereco' : undefined}
                  {...atributos}
                />
              </div>
            ))}
            <div>
              <label className="field" htmlFor="entrega-uf">UF</label>
              <select
                id="entrega-uf"
                name="uf"
                className="forminput"
                defaultValue={endereco?.uf ?? ''}
                required
                aria-invalid={erroCampo?.campo === 'uf' || undefined}
                aria-describedby={erroCampo?.campo === 'uf' ? 'erro-endereco' : undefined}
              >
                <option value="">Selecione</option>
                {estados.map((uf) => <option value={uf} key={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
          {erroCampo && <p id="erro-endereco" className="notice" role="alert">{erroCampo.erro}</p>}
          <button className="pill primary" type="submit" disabled={bloqueado}>
            {enviando ? 'Confirmando pedido…' : 'Confirmar pedido'}
          </button>
        </fieldset>
      </form>
    </section>
  );
}

function CheckoutConta({ usuarioId }) {
  const { itens, carregando, erro: erroCarrinho, gravando, recarregar } = useCarrinho();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [erroCampo, setErroCampo] = useState(null);
  const [erroPedido, setErroPedido] = useState(null);
  const [endereco, setEndereco] = useState(null);
  const [incerto, setIncerto] = useState(() => pedidoAConferir(usuarioId));
  const ativo = useRef(false);
  const envio = useRef(false);

  useEffect(() => {
    ativo.current = true;
    return () => { ativo.current = false; };
  }, []);

  const indisponivel = itens.some((item) =>
    !item.produto || quantidadeDoProduto(itens, item.produtoId) > item.produto.stock);
  const excedeLimitePedido = itens.some((item) => item.quantidade > 99);
  const bloqueado = carregando || Boolean(erroCarrinho) || !itens.length
    || indisponivel || excedeLimitePedido || gravando || incerto || enviando;

  async function confirmar(event) {
    event.preventDefault();
    if (bloqueado || envio.current) return;

    const formulario = event.currentTarget;
    const validacao = validarEndereco(new FormData(formulario));
    setErroPedido(null);
    if (validacao.erro) {
      setErroCampo(validacao);
      formulario.elements.namedItem(validacao.campo)?.focus();
      return;
    }

    setErroCampo(null);
    setEndereco(validacao.endereco);
    envio.current = true;
    setEnviando(true);
    const resultado = await finalizarPedido(usuarioId, validacao.endereco);
    envio.current = false;
    if (resultado.id) {
      recarregar();
      if (ativo.current) navigate(`/pedido-confirmado/${resultado.id}`, { replace: true });
      return;
    }
    if (!ativo.current) return;

    setEnviando(false);
    if (resultado.incerto) {
      setIncerto(true);
    } else {
      setErroPedido(resultado.erro);
      recarregar();
    }
  }

  const linhas = itens.filter((item) => item.produto).map((item) => ({
    id: item.id,
    nome: item.produto.name,
    quantidade: item.quantidade,
    precoUnitario: item.produto.price,
    subtotal: subtotalItem(item) / 100,
  }));

  return (
    <div className="container checkout-page">
      <div className="page-heading">
        <Link className="account-link" to="/carrinho">← Voltar ao carrinho</Link>
        <h1>Finalizar compra</h1>
        <p className="text-muted">Compra demonstrativa, sem processamento de pagamento real.</p>
      </div>
      {incerto && (
        <section className="panel pedido-aviso" aria-labelledby="titulo-envio-incerto">
          <h2 id="titulo-envio-incerto">Confira o histórico</h2>
          <p role="alert">Não foi possível confirmar se o pedido foi registrado. Confira Meus Pedidos antes de enviar novamente.</p>
          <div className="checkout-actions">
            <Link className="account-link" to="/minha-conta#meus-pedidos" state={{ voltarAoCheckout: true }}>
              Consultar Meus Pedidos
            </Link>
            <button className="pill" type="button" onClick={() => {
              if (!liberarNovoEnvio(usuarioId)) {
                setErroPedido('O envio ainda está em andamento. Aguarde a resposta.');
                return;
              }
              setIncerto(false);
              setErroPedido(null);
              recarregar();
            }}>Já conferi o histórico</button>
          </div>
        </section>
      )}
      {erroPedido && <p className="notice" role="alert">{erroPedido}</p>}
      {enviando && <p role="status">Confirmando pedido…</p>}
      {carregando && <p role="status">Carregando carrinho…</p>}
      {erroCarrinho && (
        <div className="cart-error">
          <p className="notice" role="alert">{erroCarrinho}</p>
          <button className="pill" type="button" onClick={recarregar}>Recarregar carrinho</button>
        </div>
      )}
      {!carregando && !erroCarrinho && !itens.length && (
        <section className="empty commerce-empty">
          <h2>Seu carrinho da conta está vazio</h2>
          <Link className="account-link" to="/loja">Explorar produtos</Link>
        </section>
      )}
      {indisponivel && (
        <p className="notice" role="alert">
          O carrinho contém itens indisponíveis ou com estoque insuficiente. Revise o <Link to="/carrinho">carrinho</Link>.
        </p>
      )}
      {excedeLimitePedido && (
        <p className="notice" role="alert">
          Cada item do pedido aceita até 99 unidades. Ajuste a quantidade no <Link to="/carrinho">carrinho</Link>.
        </p>
      )}
      {itens.length > 0 && (
        <div className="checkout-layout">
          <Endereco
            onSubmit={confirmar}
            erroCampo={erroCampo}
            bloqueado={bloqueado}
            enviando={enviando}
            endereco={endereco}
          />
          <ResumoPedido itens={linhas} total={totalCarrinho(itens)} />
        </div>
      )}
    </div>
  );
}

export default function Checkout() {
  const { user } = useSessao();
  return <CheckoutConta key={user.id} usuarioId={user.id} />;
}
