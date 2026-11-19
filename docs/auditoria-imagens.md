# Auditoria de imagens

Revisão em 19/11/2026. Esta lista cobre referências encontradas no código-fonte do projeto; imagens de produtos recebidas dinamicamente pelo catálogo/Storage podem variar conforme os dados cadastrados.

## Arquivos referenciados pela aplicação

| Arquivo | Uso observado |
| --- | --- |
| `/images/empresa/servicos.png` | Hero da Home em todos os tamanhos de tela; a imagem da Lamborghini é servida sem substituição mobile. |
| `/images/empresa/fachada-real-768.jpg` | Imagem da seção Sobre Nós; preservada. |
| `/images/empresa/fachada-real-1440.jpg` | Foto institucional na galeria Sobre Nós; preservada. |
| `/images/empresa/servicos-oficiais.jpg` | Material institucional na galeria Sobre Nós; preservado. |
| `/images/empresa/logo-marca.png` | Logotipo da navegação. |
| `/images/produtos/filtro-oleo.webp` e `/images/produtos/pneu-aro15.webp` | Imagens genéricas de produtos disponíveis no catálogo; créditos e limites de representação em [creditos-imagens.md](creditos-imagens.md). |
| `/images/produtos/placeholder.svg` | Fallback para produto sem imagem ou com falha de carregamento. |
| `https://images.unsplash.com/photo-1493238792000-8113da705763?w=1600&auto=format&fit=crop&q=85` | Fundo do painel compartilhado entre Login e Cadastro. Foto traseira de um Audi R8 vermelho em trânsito urbano; usada no antigo banner “Performance começa com confiança”. |

Arquivos encontrados em `public/images/empresa` mas sem referência no código-fonte atual: `fachada.png`, `oficina.jpg`, `logo.png` e `logo-original.jpg`. O arquivo `public/images/produtos/creditos.html` é uma página de créditos, não uma fotografia. Produtos cadastrados podem também usar uma URL externa ou uma URL pública do Supabase Storage, conforme o editor administrativo.

## Fonte e condições da foto do painel de acesso

A fotografia corresponde visualmente ao carro esportivo do banner antigo. A origem preservada no CSS é o CDN oficial do Unsplash, com largura solicitada de 1600 px, formato automático e qualidade 85. O CDN permite manter o enquadramento e evita incluir outra versão da mesma fotografia no repositório.

A [Licença Unsplash](https://unsplash.com/license) permite baixar, copiar, adaptar e usar as fotos gratuitamente, inclusive em projetos comerciais, sem exigir atribuição. Ela não concede automaticamente direitos de marca, logo ou endosso presentes dentro da fotografia. Esta imagem mostra o emblema Audi/R8; o painel serve como imagem ilustrativa do site e não afirma afiliação com a Audi. A [orientação do Unsplash sobre marcas](https://help.unsplash.com/en/articles/14224409-what-if-there-s-a-brand-logo-in-an-image) recomenda considerar direitos de terceiros conforme o uso.

Uma cópia WebP local foi considerada, mas não pôde ser baixada neste ambiente: o acesso de shell ao host `images.unsplash.com` falhou por resolução DNS. A URL transformada acima é, portanto, uma dependência externa intencional nesta alteração; não foi criada uma cópia local falsa ou derivada de captura de tela.

## Enquadramento

O painel usa `cover` e desloca o ponto focal para 66% da largura para manter a traseira do carro no quadro estreito de desktop. Em telas menores, o ponto focal fica em 66%/58%, enquanto o gradiente escuro permanece na camada superior e o texto no rodapé continua legível. O CSS de Home e as fotos institucionais de Sobre Nós não foram alterados.
