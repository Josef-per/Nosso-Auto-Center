import { Link } from 'react-router-dom';
import { CircleDot, Cog, Droplets, ShieldCheck, Truck, Wrench, BadgeCheck } from 'lucide-react';
import { useCatalogo } from '../catalogo/useCatalogo';
import ProductGrid from '../components/ProductGrid';
import CategoryCard from '../components/CategoryCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Home() {
  const { products, loading, error, retry } = useCatalogo();
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
            <Link to="/loja" className="pill primary">
              Explorar produtos →
            </Link>

            <Link to="/#servicos" className="pill ghost">
              Conheça a oficina
            </Link>
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
            <ShieldCheck className="benefit-icon" aria-hidden="true" />
            <div>
              <b>Compra segura</b>
              <small>Sua tranquilidade em primeiro lugar</small>
            </div>
          </div>

          <div className="benefit">
            <Truck className="benefit-icon" aria-hidden="true" />
            <div>
              <b>Entrega em todo o Brasil</b>
              <small>Consulte seu CEP</small>
            </div>
          </div>

          <div className="benefit">
            <BadgeCheck className="benefit-icon" aria-hidden="true" />
            <div>
              <b>Peças selecionadas</b>
              <small>Qualidade e confiança</small>
            </div>
          </div>

          <div className="benefit">
            <Wrench className="benefit-icon" aria-hidden="true" />
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

            <Link to="/loja" className="subtlelink">
              Todas as categorias →
            </Link>
          </div>

          <div className="categories">
            <CategoryCard title="Freios" description="Segurança na medida" icon={<CircleDot size={42} />} />
            <CategoryCard title="Motor e filtros" description="Cuide do coração do carro" icon={<Cog size={42} />} />
            <CategoryCard title="Pneus e rodas" description="Adesão em cada curva" icon={<CircleDot size={42} />} />
            <CategoryCard title="Óleos e fluidos" description="Proteção em movimento" icon={<Droplets size={42} />} />
          </div>
        </section>

        {/* Produtos em destaque */}
        <section>
          <div className="section-head">
            <div>
              <div className="eyebrow">ESCOLHAS PARA VOCÊ</div>
              <h2>Produtos em destaque</h2>
              <p>Uma seleção do nosso catálogo para o seu veículo.</p>
            </div>

            <Link to="/loja" className="subtlelink">
              Ver todos →
            </Link>
          </div>

          {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={retry} />
            : products.length ? <ProductGrid products={products.slice(0, 4)} />
              : <EmptyState title="Nenhum produto disponível no momento" message="Volte em breve para conferir o catálogo." />}
        </section>

        {/* Banners promocionais */}
        <section className="section" id="servicos" aria-labelledby="titulo-servicos" tabIndex={-1}>
          <div className="split-banner">
            <div className="promo">
              <div className="eyebrow" style={{ color: '#ff9d58' }}>
                MAIS DO QUE PEÇAS
              </div>

              <h2 id="titulo-servicos">Seu carro merece um cuidado completo.</h2>

              <p>
                Nossa oficina também cuida do seu veículo. Consulte a equipe para conhecer os serviços disponíveis e a compatibilidade com seu carro.
              </p>
            </div>

            <div className="promo orange">
              <div className="eyebrow" style={{ color: '#17202b' }}>
                CUIDADO EM CADA VIAGEM
              </div>

              <h3>Prepare-se para a próxima estrada.</h3>

              <p>
                Explore opções para a manutenção do seu veículo.
              </p>

              <Link to="/loja">
                Explorar peças ↗
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
