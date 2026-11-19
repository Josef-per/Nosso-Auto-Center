export const descricaoLoja = 'Catálogo de autopeças do Nosso Auto Center: consulte produtos, marcas e disponibilidade para cuidar do seu veículo. Projeto acadêmico com compras demonstrativas.';
export function metadadosDaRota(pathname) {
  const rotas = {
    '/sobre': { titulo: 'Nossa história | Nosso Auto Center', descricao: 'Conheça a história do Nosso Auto Center, oficina e autopeças em Franca desde 2018, e encontre os contatos da empresa.' },
    '/': { titulo: 'Nosso Auto Center | Autopeças e oficina', descricao: descricaoLoja },
    '/loja': { titulo: 'Loja de autopeças | Nosso Auto Center', descricao: 'Explore o catálogo de autopeças, filtre por categoria e consulte preços e estoque disponíveis no Nosso Auto Center.' },
  };
  if (rotas[pathname]) return { ...rotas[pathname], indexavel: true };
  if (/^\/produto\/[1-9]\d*$/.test(pathname)) return { titulo: 'Produto | Nosso Auto Center', descricao: 'Consulte informações, preço e disponibilidade desta autopeça no Nosso Auto Center.', indexavel: true };
  const privadas = { '/admin': 'Administração', '/login': 'Entrar', '/cadastro': 'Criar conta', '/checkout': 'Checkout demonstrativo', '/carrinho': 'Carrinho', '/minha-conta': 'Minha conta' };
  return { titulo: (privadas[pathname] || (pathname.startsWith('/pedido-confirmado/') ? 'Detalhes do pedido' : 'Página não encontrada')) + ' | Nosso Auto Center', descricao: descricaoLoja, indexavel: false };
}
export function aplicarMetadados({ titulo, descricao, indexavel }) {
  document.title = titulo;
  function meta(atributo, nome, conteudo) {
    let elemento = document.head.querySelector('meta[' + atributo + '="' + nome + '"]');
    if (!elemento) { elemento = document.createElement('meta'); elemento.setAttribute(atributo, nome); document.head.append(elemento); }
    elemento.setAttribute('content', conteudo);
  }
  meta('name', 'description', descricao);
  meta('name', 'robots', indexavel ? 'index, follow' : 'noindex, nofollow');
  meta('property', 'og:title', titulo);
  meta('property', 'og:description', descricao);
  meta('name', 'twitter:title', titulo);
  meta('name', 'twitter:description', descricao);
}
