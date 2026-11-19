export function filtrarProdutos(products, { category = 'Todos', brand = '', search = '', stockOnly = false, maxPrice = Infinity, sort = 'featured' }) {
  const query = search.trim().toLocaleLowerCase('pt-BR');
  const result = products.filter((product) => (category === 'Todos' || product.category === category)
    && (!brand || product.brand === brand)
    && (!stockOnly || product.stock > 0)
    && `${product.name} ${product.brand}`.toLocaleLowerCase('pt-BR').includes(query)
    && product.price <= maxPrice);
  if (sort === 'low') result.sort((a, b) => a.price - b.price);
  if (sort === 'high') result.sort((a, b) => b.price - a.price);
  return result;
}
