import SelectField from '../components/SelectField';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Cog, X } from 'lucide-react';
import { filtrarProdutos } from '../catalogo/filtrarProdutos';
import { formatarPreco } from '../lib/formatarPreco';
import ProductSkeleton from '../components/ProductSkeleton';
import { useCatalogo } from '../catalogo/useCatalogo';
import ProductFilters from '../components/ProductFilters';
import ProductGrid from '../components/ProductGrid';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Loja() {
  const { products, loading, error, retry } = useCatalogo();
  const [params, setParams] = useSearchParams();
  const category = params.get('categoria') || 'Todos';
  const search = params.get('busca') || '';
  function parametro(nome, valor) { setParams((atual) => { const next = new URLSearchParams(atual); if (valor && valor !== 'Todos') next.set(nome, valor); else next.delete(nome); return next; }, { replace: true }); }
  const setCategory = (valor) => parametro('categoria', valor);
  const setSearch = (valor) => parametro('busca', valor);
  const [brand, setBrand] = useState('');
  const [stockOnly, setStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 731px)').matches);
  const [sort, setSort] = useState('featured');
  const [price, setPrice] = useState(null);
  const priceLimit = Math.max(500, Math.ceil(Math.max(0, ...products.map((product) => product.price)) / 10) * 10);
  const maxPrice = price ?? priceLimit;
  const categories = ['Todos', ...new Set(products.map((product) => product.category))];
  const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))].sort();
  const filteredProducts = useMemo(() => filtrarProdutos(products, { category, brand, stockOnly, search, sort, maxPrice }), [products, category, brand, stockOnly, search, sort, maxPrice]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 731px)');
    const alterar = () => setFiltersOpen(media.matches);
    media.addEventListener('change', alterar);
    return () => media.removeEventListener('change', alterar);
  }, []);
  function clearFilters() {
    setParams({}, { replace: true }); setBrand(''); setStockOnly(false); setSort('featured'); setPrice(null);
  }
  const chips = [category !== 'Todos' && { label: category, clear: () => setCategory('Todos') }, brand && { label: brand, clear: () => setBrand('') }, stockOnly && { label: 'Em estoque', clear: () => setStockOnly(false) }, price !== null && { label: `Até ${formatarPreco(maxPrice)}`, clear: () => setPrice(null) }, search && { label: `Busca: ${search}`, clear: () => setSearch('') }].filter(Boolean);
  return <div className="container">
    <div className="page-heading catalog-heading"><div>
      <nav className="crumb" aria-label="Localização"><Link to="/">Início</Link><span aria-hidden="true"> / </span><span aria-current="page">Autopeças</span></nav>
      <p className="eyebrow">O PRÓXIMO CAMINHO COMEÇA AQUI</p><h1>Peças para ir mais longe.</h1>
      <p className="text-muted">Encontre produtos de qualidade para cuidar do seu carro.</p>
    </div><span className="catalog-heading-mark" aria-hidden="true"><Cog size={38} strokeWidth={1} /></span></div>
    <div className="catalog-search"><Search size={20} aria-hidden="true" />
      <label className="sr-only" htmlFor="busca-produtos">Buscar produto ou marca</label>
      <input id="busca-produtos" className="forminput" type="search" placeholder="O que seu carro precisa? Busque por peça ou marca" value={search} onChange={(event) => setSearch(event.target.value)} />
    </div>
    <div className="catalog-layout">
      <details className="filter-drawer" open={filtersOpen} onToggle={(event) => setFiltersOpen(event.currentTarget.open)}><summary>Filtros {chips.length ? `(${chips.length})` : ''}<SlidersHorizontal size={18} aria-hidden="true" /></summary><ProductFilters categories={categories} category={category} onCategory={setCategory} brands={brands} brand={brand} onBrand={setBrand} stockOnly={stockOnly} onStock={setStockOnly} maxPrice={maxPrice} priceLimit={priceLimit} onPrice={setPrice} onClear={clearFilters} /></details>
      <section className="catalog-results" aria-label="Catálogo">
        <div className="catalog-top">
          <span className="text-muted" role="status">{loading ? 'Consultando catálogo…' : error ? 'Catálogo indisponível' : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`}</span>
          <label className="sort-label">Ordenar por<SelectField aria-label="Ordenar por" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Mais relevantes</option><option value="low">Menor preço</option><option value="high">Maior preço</option>
          </SelectField></label>
        </div>
        {chips.length > 0 && <div className="filter-chips" aria-label="Filtros ativos">{chips.map((chip) => <button className="filter-chip" key={chip.label} type="button" onClick={chip.clear} aria-label={`Remover filtro ${chip.label}`}>{chip.label}<X size={13} aria-hidden="true" /></button>)}<button className="filter-clear" type="button" onClick={clearFilters}>Limpar tudo</button></div>}
        {loading ? <ProductSkeleton /> : error ? <ErrorState message={error} onRetry={retry} />
          : filteredProducts.length ? <ProductGrid products={filteredProducts} />
            : <EmptyState message="Experimente alterar os filtros ou a busca."><button className="pill primary" type="button" onClick={clearFilters}>Limpar filtros</button></EmptyState>}
      </section>
    </div>
  </div>;
}
