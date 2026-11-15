import "../css/global.css"
import { useEffect, useState } from 'react';
import { listarProdutos } from '../services/produtoService';

export default function Home() {

  
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  let ativo = true;

  async function carregarProdutos() {
    try {
      const dados = await listarProdutos();

      if (ativo) {
        setProducts(dados.slice(0, 4));
      }
    } catch (erro) {
      if (ativo) {
        console.error('Erro ao carregar destaques:', erro);
        setError(erro.message);
      }
    } finally {
      if (ativo) {
        setLoading(false);
      }
    }
  }

  carregarProdutos();

  return () => {
    ativo = false;
  };
}, []);


  const money = (value) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });



  return (
    <>
      {/* Banner principal */}
      <div className="hero">
        <div className="hero-content">
          <div className="eyebrow">AUTOCENTER & AUTOPEÇAS</div>

          <h1>
            Performance começa com <em>confiança.</em>
          </h1>

          <p>
            As melhores peças e serviços para você seguir em frente
            com segurança. Tudo o que seu carro precisa, em um só lugar.
          </p>

          <div className="hero-actions">
            <a href="/loja" className="pill primary">
              Explorar produtos →
            </a>

            <a href="/servicos" className="pill ghost">
              Conheça a oficina
            </a>
          </div>
        </div>

        <div className="hero-tag">
          ● O cuidado está em cada detalhe
        </div>
      </div>

      <div className="container">
        {/* Benefícios */}
        <div className="benefits">
          <div className="benefit">
            <div className="benefit-icon">♧</div>
            <div>
              <b>Compra segura</b>
              <small>Sua tranquilidade em primeiro lugar</small>
            </div>
          </div>

          <div className="benefit">
            <div className="benefit-icon">♧</div>
            <div>
              <b>Entrega em todo o Brasil</b>
              <small>Consulte seu CEP</small>
            </div>
          </div>

          <div className="benefit">
            <div className="benefit-icon">✦</div>
            <div>
              <b>Peças selecionadas</b>
              <small>Qualidade e confiança</small>
            </div>
          </div>

          <div className="benefit">
            <div className="benefit-icon">⚒</div>
            <div>
              <b>Suporte especializado</b>
              <small>Conte com nossa equipe</small>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">ENCONTRE O QUE PRECISA</div>
              <h2>Explore nossas categorias</h2>
              <p>
                De manutenção básica a performance, temos o essencial.
              </p>
            </div>

            <a href="/loja" className="subtlelink">
              Todas as categorias →
            </a>
          </div>

          <div className="categories">
            <a href="/loja" className="cat">
              <strong>Freios</strong>
              <small>Segurança na medida</small>
              <div className="huge">◉</div>
            </a>

            <a href="/loja" className="cat">
              <strong>Motor e filtros</strong>
              <small>Cuide do coração do carro</small>
              <div className="huge">⚙</div>
            </a>

            <a href="/loja" className="cat">
              <strong>Pneus e rodas</strong>
              <small>Adesão em cada curva</small>
              <div className="huge">◍</div>
            </a>

            <a href="/loja" className="cat">
              <strong>Óleos e fluidos</strong>
              <small>Proteção em movimento</small>
              <div className="huge">◈</div>
            </a>
          </div>
        </section>

        {/* Produtos em destaque */}
        <section>
          <div className="section-head">
            <div>
              <div className="eyebrow">ESCOLHAS PARA VOCÊ</div>
              <h2>Produtos em destaque</h2>
              <p>Os favoritos de quem entende de carro.</p>
            </div>

            <a href="/loja" className="subtlelink">
              Ver todos →
            </a>
          </div>

          <div className="products">
            {loading ? (
              <p>Carregando produtos...</p>
            ) : error ? (
              <p role="alert">
                Erro ao carregar produtos: {error}
              </p>
            ) : products.length === 0 ? (
              <p>Nenhum produto disponível no momento.</p>
            ) : products.map((product) => (
              <article className="product" key={product.id}>
                <div className="product-img">
                  <img src={product.image} alt={product.name} />

                  <span className="tag">{product.badge}</span>
                </div>

                <div className="product-body">
                  <small>{product.category}</small>

                  <h3>{product.name}</h3>

                  <div className="rating">
                    ★★★★★ <span style={{ color: 'var(--muted)' }}>(4,8)</span>
                  </div>

                  <div className="price">
                    {money(product.price)}
                  </div>

                  <div className="installments">
                    ou em até 6x sem juros*
                  </div>

                  <button className="pill">
                    Adicionar ao carrinho →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Banners promocionais */}
        <section className="section">
          <div className="split-banner">
            <div className="promo">
              <div className="eyebrow" style={{ color: '#ff9d58' }}>
                MAIS DO QUE PEÇAS
              </div>

              <h3>Seu carro merece um cuidado completo.</h3>

              <p>
                Conheça os serviços especializados da nossa oficina.
              </p>

              <a href="/servicos">
                Conhecer serviços ↗
              </a>
            </div>

            <div className="promo orange">
              <div className="eyebrow" style={{ color: 'white' }}>
                NOVA COLEÇÃO
              </div>

              <h3>Prepare-se para a próxima estrada.</h3>

              <p>
                Explore opções para a manutenção do seu veículo.
              </p>

              <a href="/loja">
                Explorar peças ↗
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
