import { Link } from 'react-router-dom';
import AdicionarAoCarrinho from './AdicionarAoCarrinho';
import ProductImage from './ProductImage';
import { formatarPreco } from '../lib/formatarPreco';
export default function ProductCard({ product }) {
  return <article className="product">
    <Link className="product-img" to={`/produto/${product.id}`} tabIndex={-1} aria-hidden="true">
      <ProductImage src={product.image} alt="" />
      {product.badge && <span className="tag">{product.badge}</span>}
    </Link>
    <div className="product-body">
      <small>{product.category}</small>
      <h3><Link to={`/produto/${product.id}`}>{product.name}</Link></h3>
      {product.brand && <p className="product-brand">{product.brand}</p>}
      <div className="product-pricing">
        {product.oldPrice > product.price && <del className="old-price">{formatarPreco(product.oldPrice)}</del>}
        <p className="price">{formatarPreco(product.price)}</p>
        <p className="installments">{product.stock > 0 ? 'Disponível em estoque' : 'Temporariamente indisponível'}</p>
      </div>
      <AdicionarAoCarrinho produto={product} />
    </div>
  </article>;
}
