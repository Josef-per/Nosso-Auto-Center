import "../css/global.css"


export default function Home() {

  const products = [
    {
      id: 1,
      name: 'Óleo de motor sintético 5W30 · 1L',
      category: 'Óleos e fluidos',
      price: 54.9,
      image:
        'https://images.unsplash.com/photo-1635784063388-647d0f6d2a30?w=650&fit=crop',
      badge: 'MAIS VENDIDO',
    },
    {
      id: 2,
      name: 'Kit pastilha de freio dianteiro',
      category: 'Freios',
      price: 149.9,
      image:
        'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=650&fit=crop',
      badge: 'OFERTA',
    },
    {
      id: 3,
      name: 'Filtro de óleo para motor',
      category: 'Motor e filtros',
      price: 38.5,
      image:
        'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=650&fit=crop',
      badge: 'NOVO',
    },
    {
      id: 4,
      name: 'Pneu aro 15 · 195/55 R15',
      category: 'Pneus e rodas',
      price: 329.9,
      image:
        'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=650&fit=crop',
      badge: '-15%',
    },
  ];

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
            {products.map((product) => (
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
