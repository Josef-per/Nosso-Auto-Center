import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useCatalogo } from '../catalogo/useCatalogo';
import ProductFilters from '../components/ProductFilters';
import ProductGrid from '../components/ProductGrid';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Loja() {
  const { products, loading, error, retry } = useCatalogo();
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [price, setPrice] = useState(null);
  const priceLimit = Math.max(500, Math.ceil(Math.max(0, ...products.map((product) => product.price)) / 10) * 10);
  const maxPrice = price ?? priceLimit;
  const categories = ['Todos', ...new Set(products.map((product) => product.category))];
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const result = products.filter((product) => (category === 'Todos' || product.category === category)
      && (product.name.toLocaleLowerCase('pt-BR').includes(query) || product.brand.toLocaleLowerCase('pt-BR').includes(query))
      && product.price <= maxPrice);
    if (sort === 'low') result.sort((a, b) => a.price - b.price);
    if (sort === 'high') result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, category, search, sort, maxPrice]);
  function clearFilters() {
    setCategory('Todos'); setSearch(''); setSort('featured'); setPrice(null);
  }
  return <div className="container">
    <div className="page-heading">
      <nav className="crumb" aria-label="Localização"><Link to="/">Início</Link><span aria-hidden="true"> / </span><span aria-current="page">Autopeças</span></nav>
      <h1>Peças para ir mais longe.</h1>
      <p className="text-muted">Encontre produtos de qualidade para cuidar do seu carro.</p>
    </div>
    <div className="catalog-layout">
      <ProductFilters categories={categories} category={category} onCategory={setCategory} maxPrice={maxPrice} priceLimit={priceLimit} onPrice={setPrice} onClear={clearFilters} />
      <section className="catalog-results" aria-label="Catálogo">
        <div className="catalog-top">
          <span className="text-muted" role="status">{loading ? 'Consultando catálogo…' : error ? 'Catálogo indisponível' : filteredProducts.length + ' produtos encontrados'}</span>
          <label className="sort-label">Ordenar por<select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Mais relevantes</option><option value="low">Menor preço</option><option value="high">Maior preço</option>
          </select></label>
        </div>
        <div className="catalog-search"><Search size={18} aria-hidden="true" />
          <label className="sr-only" htmlFor="busca-produtos">Buscar produto ou marca</label>
          <input id="busca-produtos" className="forminput" type="search" placeholder="Buscar produto ou marca…" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={retry} />
          : filteredProducts.length ? <ProductGrid products={filteredProducts} />
            : <EmptyState message="Experimente alterar os filtros ou a busca."><button className="pill primary" type="button" onClick={clearFilters}>Limpar filtros</button></EmptyState>}
      </section>
    </div>
  </div>;
}
