import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSessao } from '../auth/useSessao';
import { subtotalItem, totalCarrinho } from '../carrinho/resumoCarrinho';
import { quantidadeDoProduto, useCarrinho } from '../carrinho/useCarrinho';
import ResumoPedido from '../components/ResumoPedido';
import CheckoutForm from '../checkout/CheckoutForm';
import { validarEndereco } from '../lib/enderecoEntrega';
import { apenasDigitos, cpfValido } from '../lib/identificacao';
import { calcularFrete } from '../lib/frete';
import { conferirCheckout, finalizarPedido, liberarNovoEnvio, pedidoAConferir } from '../services/pedidoService';

function CheckoutConta({ usuarioId }) {
  const { itens, carregando, erro: erroCarrinho, gravando, recarregar } = useCarrinho();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [erroCampo, setErroCampo] = useState(null);
  const [erroPedido, setErroPedido] = useState(null);
  const [endereco, setEndereco] = useState({ cep: '', logradouro: '', numero: '', bairro: '', complemento: '', cidade: '', uf: '' });
  const [pagamento, setPagamento] = useState('pix');
  const [backend, setBackend] = useState('carregando');
  const [checagem, setChecagem] = useState(0);
  const frete = calcularFrete(endereco.cep);
  useEffect(() => {
    let ativo = true;
    conferirCheckout().then((disponivel) => { if (ativo) setBackend(disponivel ? 'pronto' : 'indisponivel'); },
      () => { if (ativo) setBackend('indisponivel'); });
    return () => { ativo = false; };
  }, [checagem]);
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
    || indisponivel || excedeLimitePedido || gravando || incerto || enviando || backend !== 'pronto';

  async function confirmar(event) {
    event.preventDefault();
    if (bloqueado || envio.current) return;

    const formulario = event.currentTarget;
    const dados = new FormData(formulario);
    const cpf = apenasDigitos(dados.get('cpf'));
    const validacao = !cpfValido(cpf) ? { campo: 'cpf', erro: 'Informe um CPF com dígitos verificadores válidos.' }
      : !['pix', 'boleto', 'cartao_credito'].includes(pagamento) ? { campo: 'pagamento', erro: 'Selecione uma forma de pagamento demonstrativa.' }
        : validarEndereco(dados);
    setErroPedido(null);
    if (validacao.erro) {
      setErroCampo(validacao);
      formulario.querySelector('[name="' + validacao.campo + '"]')?.focus();
      return;
    }

    setErroCampo(null);

    envio.current = true;
    setEnviando(true);
    const resultado = await finalizarPedido(usuarioId, validacao.endereco, pagamento, cpf);
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
      <ol className="checkout-steps" aria-label="Etapas da compra"><li><span>1</span>Carrinho</li><li aria-current="step"><span>2</span>Entrega e pagamento</li><li><span>3</span>Confirmação</li></ol>
      {backend !== 'pronto' && <div className="notice" role="status">
        {backend === 'carregando' ? 'Verificando disponibilidade do checkout…' : 'Checkout temporariamente indisponível. A configuração de frete e pagamento ainda precisa ser confirmada no servidor.'}
        {backend === 'indisponivel' && <button type="button" className="pill" onClick={() => { setBackend('carregando'); setChecagem((n) => n + 1); }}>Verificar novamente</button>}
      </div>}
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
          <CheckoutForm
            onSubmit={confirmar}
            erroCampo={erroCampo}
            bloqueado={bloqueado}
            enviando={enviando}
            endereco={endereco}
            onEndereco={setEndereco}
            pagamento={pagamento}
            onPagamento={setPagamento}
            frete={frete}
          />
          <ResumoPedido itens={linhas} subtotal={totalCarrinho(itens)} frete={frete} total={Math.round((totalCarrinho(itens) + (frete ?? 0)) * 100) / 100} />
        </div>
      )}
    </div>
  );
}

export default function Checkout() {
  const { user } = useSessao();
  return <CheckoutConta key={user.id} usuarioId={user.id} />;
}
