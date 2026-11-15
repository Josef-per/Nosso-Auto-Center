
import { useEffect, useMemo, useState } from 'react';
import { listarProdutos } from '../services/produtoService';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';


export default function Loja() {

  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      try {
        const dados = await listarProdutos();

        if (ativo) {
          setProducts(dados);
        }
      } catch (erro) {
        if (ativo) {
          console.error('Erro ao carregar produtos:', erro);
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
  }, [products, category, search, sort, maxPrice]);

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

            {loading ? (
              <div className="empty">
                <p>Carregando produtos...</p>
              </div>
            ) : error ? (
              <div className="empty" role="alert">
                <h2>Erro ao carregar produtos</h2>
                <p>{error}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
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
