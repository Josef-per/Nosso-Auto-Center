import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, CircleDot, Cog, Crosshair,
  Disc3, Droplets, Gauge, PackageCheck, ShoppingBag, Truck, Wind, Wrench,
} from 'lucide-react';
import { useCatalogo } from '../catalogo/useCatalogo';
import ProductGrid from '../components/ProductGrid';
import CategoryCard from '../components/CategoryCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const servicos = [
  { titulo: 'Pneus', descricao: 'Venda, troca e manutenção de pneus. O cuidado começa no contato com a estrada.', icone: CircleDot },
  { titulo: 'Alinhamento', descricao: 'Ajuste da direção para uma condução estável e desgaste uniforme dos pneus.', icone: Crosshair },
  { titulo: 'Balanceamento', descricao: 'Equilíbrio das rodas para reduzir vibrações e melhorar o conforto ao dirigir.', icone: Gauge },
  { titulo: 'Suspensão', descricao: 'Avaliação e reparo do sistema que cuida da estabilidade do seu veículo.', icone: Cog },
  { titulo: 'Freios', descricao: 'Revisão de pastilhas, discos e componentes do sistema de frenagem.', icone: Disc3 },
  { titulo: 'Troca de óleo', descricao: 'Troca de óleo e filtros conforme as especificações do fabricante.', icone: Droplets },
  { titulo: 'Escapamentos', descricao: 'Inspeção e manutenção do sistema de escapamento do veículo.', icone: Wind },
];

export default function Home() {
  const { products, loading, error, retry } = useCatalogo();

  useEffect(() => {
    // O catálogo assíncrono pode deslocar a seção depois da navegação inicial.
    const destino = document.getElementById('servicos');
    if (!loading && window.location.hash === '#servicos' && document.activeElement === destino) {
      destino.scrollIntoView({ block: 'start' });
    }
  }, [loading]);

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="titulo-home">
        <picture className="home-hero-photo">
          <source media="(max-width: 730px)" srcSet="/images/empresa/fachada-real-768.jpg" />
          <img
            src="/images/empresa/fachada-real-1440.jpg"
            alt="Fachada da oficina Nosso Auto Center"
            width="1440"
            height="522"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className="container home-hero-inner">
          <div className="home-hero-content">
            <p className="eyebrow"><span aria-hidden="true" />AUTOPEÇAS &amp; SERVIÇOS AUTOMOTIVOS</p>
            <h1 id="titulo-home">Seu próximo caminho começa com <em>confiança.</em></h1>
            <p className="home-hero-description">
              Da peça certa ao cuidado na oficina. Encontre o que seu carro precisa para seguir em frente.
            </p>
            <div className="hero-actions">
              <Link to="/loja" className="pill primary">
                Explorar produtos <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/#servicos" className="pill ghost">
                Conhecer serviços <ArrowDown size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="home-hero-caption">
            <span className="home-photo-line" aria-hidden="true" />
            <span>Nosso Auto Center<small>O cuidado está em cada detalhe.</small></span>
          </div>
        </div>
      </section>

      <div className="home-benefits-wrap">
        <ul className="container home-benefits" aria-label="Facilidades da loja">
          <li><PackageCheck aria-hidden="true" /><div><strong>Catálogo online</strong><span>Marcas, peças e disponibilidade</span></div></li>
          <li><Truck aria-hidden="true" /><div><strong>Frete por CEP</strong><span>Consulte a estimativa no checkout</span></div></li>
          <li><ShoppingBag aria-hidden="true" /><div><strong>Seu carrinho</strong><span>Organize suas escolhas</span></div></li>
          <li><Wrench aria-hidden="true" /><div><strong>Autopeças e oficina</strong><span>Cuidado além das peças</span></div></li>
        </ul>
      </div>

      <div className="container">
        <section className="home-section home-categories" aria-labelledby="titulo-categorias">
          <div className="section-head">
            <div>
              <p className="eyebrow">CADA PEÇA TEM SEU CAMINHO</p>
              <h2 id="titulo-categorias">O que seu carro precisa?</h2>
              <p>Explore as categorias e encontre a próxima peça.</p>
            </div>
            <Link to="/loja" className="subtlelink">Explorar a loja <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className="categories">
            <CategoryCard title="Freios" description="Controle e segurança" icon={<Disc3 size={34} />} />
            <CategoryCard title="Motor e filtros" description="Cuidado com o essencial" icon={<Cog size={34} />} />
            <CategoryCard title="Pneus e rodas" description="Seu contato com a estrada" icon={<CircleDot size={34} />} />
            <CategoryCard title="Óleos e fluidos" description="Proteção a cada quilômetro" icon={<Droplets size={34} />} />
          </div>
        </section>

        <section className="home-section home-featured" aria-labelledby="titulo-destaques">
          <div className="section-head">
            <div>
              <p className="eyebrow">DIRETO DO NOSSO CATÁLOGO</p>
              <h2 id="titulo-destaques">Em destaque na loja</h2>
              <p>Uma seleção de peças para cuidar do seu veículo.</p>
            </div>
            <Link to="/loja" className="subtlelink">Ver todos os produtos <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={retry} />
            : products.length ? <ProductGrid products={products.slice(0, 4)} />
              : <EmptyState title="Nenhum produto disponível no momento" message="Volte em breve para conferir o catálogo." />}
        </section>
      </div>

      <section className="home-services" id="servicos" aria-labelledby="titulo-servicos" tabIndex={-1}>
        <div className="container">
          <div className="home-services-heading">
            <div>
              <p className="eyebrow">NA OFICINA, O CUIDADO CONTINUA</p>
              <h2 id="titulo-servicos">Mais que peças.<br />Cuidado por completo.</h2>
            </div>
            <p>Da manutenção do dia a dia aos detalhes que fazem diferença na direção. Conheça os serviços do Nosso Auto Center.</p>
          </div>
          <div className="home-services-grid">
            {servicos.map(({ titulo, descricao, icone: Icone }, index) => (
              <article className={`home-service${index === 0 ? ' home-service-featured' : ''}`} key={titulo}>
                <div className="home-service-top">
                  <Icone size={30} strokeWidth={1.6} aria-hidden="true" />
                  <span aria-hidden="true">0{index + 1}</span>
                </div>
                <h3>{titulo}</h3>
                <p>{descricao}</p>
              </article>
            ))}
          </div>
          <p className="home-services-note"><Wrench size={16} aria-hidden="true" />Consulte a equipe sobre o serviço adequado ao seu veículo.</p>
        </div>
      </section>

      <section className="container home-closing" aria-labelledby="titulo-proximo-caminho">
        <div>
          <p className="eyebrow">NOSSO AUTO CENTER</p>
          <h2 id="titulo-proximo-caminho">Pronto para o próximo caminho?</h2>
          <p>Encontre no catálogo as peças para a manutenção do seu carro.</p>
        </div>
        <Link to="/loja" className="pill primary">Explorar produtos <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
