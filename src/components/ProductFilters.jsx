import { SlidersHorizontal, X } from 'lucide-react';
import { formatarPreco } from '../lib/formatarPreco';

export default function ProductFilters({ categories, category, onCategory, maxPrice, priceLimit, onPrice, onClear }) {
  return <aside className="filters" aria-label="Filtros de produtos">
    <div className="section-head"><h2>Filtrar produtos</h2><SlidersHorizontal size={18} aria-hidden="true" /></div>
    <fieldset className="filter-group">
      <legend>Categorias</legend>
      {categories.map((item) => <label key={item}><input type="radio" name="category" checked={category === item} onChange={() => onCategory(item)} />{item}</label>)}
    </fieldset>
    <div className="filter-group">
      <label className="filter-title" htmlFor="preco-maximo">Faixa de preço</label>
      <p className="text-muted">Até {formatarPreco(maxPrice)}</p>
      <input id="preco-maximo" type="range" min="0" max={priceLimit} step="10" value={maxPrice}
        aria-valuetext={formatarPreco(maxPrice)} onChange={(event) => onPrice(Number(event.target.value))} />
    </div>
    <button className="pill" type="button" onClick={onClear}><X size={15} aria-hidden="true" />Limpar filtros</button>
  </aside>;
}
