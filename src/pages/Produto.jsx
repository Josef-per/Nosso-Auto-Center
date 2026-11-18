import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { quantidadeDoProduto, useCarrinho } from '../carrinho/useCarrinho';
import AdicionarAoCarrinho from '../components/AdicionarAoCarrinho';
import CampoQuantidade from '../components/CampoQuantidade';
import { formatarPreco } from '../lib/formatarPreco';
import { buscarProduto } from '../services/produtoService';

function Detalhes({ produto }) {
  const { itens, gravando } = useCarrinho();
  const [quantidade, setQuantidade] = useState('1');
  const noCarrinho = quantidadeDoProduto(itens, produto.id);
  const limite = Math.max(0, produto.stock - noCarrinho);

  return (
    <article className="detail-layout product-detail">
      <div className="detail-photo">
        <img src={produto.image} alt={produto.name} />
      </div>
      <div className="details">
        <p className="eyebrow">{produto.category}</p>
        <h1>{produto.name}</h1>
        {produto.brand && <p className="text-muted">Marca: {produto.brand}</p>}
        {produto.oldPrice > produto.price && (
          <p className="text-muted old-price"><del>{formatarPreco(produto.oldPrice)}</del></p>
        )}
        <p className="price">{formatarPreco(produto.price)}</p>
        <p className="product-stock">
          {produto.stock > 0 ? `Estoque disponível: ${produto.stock}` : 'Sem estoque'}
          {noCarrinho > 0 && <span className="text-muted">{noCarrinho} no carrinho</span>}
        </p>
        <div className="detail-actions">
          {limite > 0 && (
            <CampoQuantidade quantidade={quantidade} limite={limite} onChange={setQuantidade} disabled={gravando} />
          )}
          <AdicionarAoCarrinho produto={produto} quantidade={Number(quantidade)} destaque />
        </div>
        <div className="divider" />
        <h2>Descrição</h2>
        <p className="text-muted product-description">{produto.description || 'Descrição indisponível.'}</p>
      </div>
    </article>
  );
}

function ConsultaProduto({ id }) {
  const [resultado, setResultado] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    buscarProduto(id).then(
      (produto) => { if (ativo) setResultado({ produto }); },
      () => { if (ativo) setResultado({ erro: true }); },
    );
    return () => { ativo = false; };
  }, [id, tentativa]);

  return (
    <div className="container product-page">
      <Link className="account-link" to="/loja">← Voltar para a Loja</Link>
      {!resultado && <p className="route-status" role="status">Carregando produto…</p>}
      {resultado?.erro && (
        <div className="empty commerce-empty">
          <h1 role="alert">Não foi possível carregar o produto</h1>
          <button
            className="pill"
            type="button"
            onClick={() => {
              setResultado(null);
              setTentativa(tentativa + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {resultado?.produto === null && (
        <div className="empty commerce-empty">
          <h1>Produto não encontrado</h1>
          <p className="text-muted">Este produto pode ter saído do catálogo.</p>
        </div>
      )}
      {resultado?.produto && <Detalhes produto={resultado.produto} />}
    </div>
  );
}

export default function Produto() {
  const { id } = useParams();
  return <ConsultaProduto key={id} id={id} />;
}
