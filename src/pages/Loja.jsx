
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';


export default function Loja() {

  const products = [
    {
      id: 1,
      name: 'Pastilha de freio dianteira',
      category: 'Freios',
      price: 89.9,
      oldPrice: 119.9,
      brand: 'Bosch',
      badge: 'OFERTA',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600',
    },
    {
      id: 2,
      name: 'Óleo sintético 5W30',
      category: 'Óleos e fluidos',
      price: 49.9,
      oldPrice: 0,
      brand: 'Mobil',
      badge: 'POPULAR',
      image: 'https://images.unsplash.com/photo-1635784063382-7d2e2f6b4e8d?w=600',
    },
    {
      id: 3,
      name: 'Filtro de óleo automotivo',
      category: 'Motor e filtros',
      price: 34.9,
      oldPrice: 45.9,
      brand: 'Tecfil',
      badge: 'NOVO',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600',
    },
    {
      id: 4,
      name: 'Pneu aro 15 · 195/55 R15',
      category: 'Pneus e rodas',
      price: 329.9,
      oldPrice: 389.9,
      brand: 'Goodyear',
      badge: '-15%',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    },
    {
      id: 5,
      name: 'Bateria automotiva 60Ah',
      category: 'Elétrica',
      price: 419.9,
      oldPrice: 0,
      brand: 'Moura',
      badge: 'GARANTIA',
      image: 'https://images.unsplash.com/photo-1609592424848-7e6b3e2d5a2e?w=600',
    },
    {
      id: 6,
      name: 'Farol de LED premium H7',
      category: 'Iluminação',
      price: 119.9,
      oldPrice: 159.9,
      brand: 'Philips',
      badge: 'OFERTA',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    },
    {
      id: 7,
      name: 'Jogo de discos de freio ventilados',
      category: 'Freios',
      price: 269.9,
      oldPrice: 0,
      brand: 'Bosch',
      badge: 'POPULAR',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600',
    },
    {
      id: 8,
      name: 'Kit de filtros para revisão',
      category: 'Motor e filtros',
      price: 89.9,
      oldPrice: 115,
      brand: 'Tecfil',
      badge: 'KIT',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600',
    },
  ];

  const money = (value) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(500);

  const categories = [
    'Todos',
    ...new Set(products.map((product) => product.category)),
  ];

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory =
        category === 'Todos' || product.category === category;

      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase());

      const matchesPrice = product.price <= maxPrice;

      return matchesCategory && matchesSearch && matchesPrice;
    });

    if (sort === 'low') {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === 'high') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [category, search, sort, maxPrice]);

  function clearFilters() {
    setCategory('Todos');
    setSearch('');
    setSort('featured');
    setMaxPrice(500);
  }

  return (
    <>
      <main className="container">
        <div className="page-heading">
          <div className="crumb">
            <Link to="/">Início</Link> / Autopeças
          </div>

          <h1>Peças para ir mais longe.</h1>

          <p className="text-muted">
            Encontre produtos de qualidade para cuidar do seu carro.
          </p>
        </div>

        <div className="catalog-layout">
          <aside className="filters">
            <div className="section-head">
              <h3>Filtrar produtos</h3>
              <SlidersHorizontal size={18} />
            </div>

            <div className="filter-group">
              <h4>Categorias</h4>

              {categories.map((item) => (
                <label key={item}>
                  <input
                    type="radio"
                    name="category"
                    checked={category === item}
                    onChange={() => setCategory(item)}
                  />
                  {item}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h4>Faixa de preço</h4>

              <p className="text-muted">
                Até {money(maxPrice)}
              </p>

              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                style={{ accentColor: 'var(--accent)', width: '100%' }}
              />
            </div>

            <button className="pill" onClick={clearFilters}>
              <X size={15} />
              Limpar filtros
            </button>
          </aside>

          <section>
            <div className="catalog-top">
              <span className="text-muted">
                {filteredProducts.length} produtos encontrados
              </span>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="featured">Mais relevantes</option>
                <option value="low">Menor preço</option>
                <option value="high">Maior preço</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                  }}
                />

                <input
                  className="forminput"
                  placeholder="Buscar produto ou marca..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="products">
                {filteredProducts.map((product) => (
                  <article className="product" key={product.id}>
                    <div className="product-img">
                      <Link to={`/produto/${product.id}`}>
                        <img src={product.image} alt={product.name} />
                      </Link>

                      <span className="tag">{product.badge}</span>
                    </div>

                    <div className="product-body">
                      <small>{product.category}</small>

                      <h3>
                        <Link to={`/produto/${product.id}`}>
                          {product.name}
                        </Link>
                      </h3>

                      <div className="rating">
                        ★★★★★ <span>(4,8)</span>
                      </div>

                      {product.oldPrice > 0 && (
                        <small
                          style={{
                            textDecoration: 'line-through',
                            color: 'var(--muted)',
                          }}
                        >
                          {money(product.oldPrice)}
                        </small>
                      )}

                      <div className="price">
                        {money(product.price)}
                      </div>

                      <div className="installments">
                        ou em até 6x sem juros*
                      </div>

                      <button
                        className="pill"
                        onClick={() =>
                          alert('Carrinho será integrado na próxima etapa!')
                        }
                      >
                        Adicionar ao carrinho →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                <h2>Nenhum produto encontrado.</h2>
                <p className="text-muted">
                  Experimente alterar os filtros ou a busca.
                </p>

                <button className="pill primary" onClick={clearFilters}>
                  Limpar filtros
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
