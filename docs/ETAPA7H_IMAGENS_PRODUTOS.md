# Etapa 7H — apresentação de imagens de produtos

## Alterações de CSS

- A área de imagem dos cards na Loja e nos destaques da Home usa proporção 4:3 em todos os breakpoints. Removidas as variações anteriores de proporção dos cards destacados.
- O fundo é um cinza quase branco constante (`--image-bg: #f8f9fa`) nos dois temas, com padding responsivo para manter pneus, embalagens e peças completas.
- Cards e detalhes continuam usando `object-fit: contain`; não foi aplicado `cover` às fotos de produto. A página individual agora também usa 4:3 e padding proporcional.
- Badges continuam visíveis no alto da imagem. Quando há badge, o padding superior reserva espaço para ele antes da área útil da foto.
- Reduzido o zoom de hover dos produtos para 1,5%, sem mudança nos dados, URLs ou arquivos de imagem.

## Arquivos locais inspecionados

| Arquivo | Observação visual | Próxima imagem recomendada, se houver substituição manual |
| --- | --- | --- |
| `public/images/produtos/filtro-oleo.webp` | Foto genérica de filtro com moeda e faixa de crédito/legenda incorporadas no arquivo. A faixa não vem do CSS e reduz a área visual do filtro. | Para um cadastro Tecfil específico, obter uma foto autorizada do filtro exato, com fundo branco uniforme e sem faixa sobreposta; preservar o crédito da fonte no sistema de créditos. Não reutilizar esta foto como peça oficial da marca. |
| `public/images/produtos/pneu-aro15.webp` | Foto genérica de pneu montado, com parte do carro/piso e faixa de crédito incorporados. Não identifica marca, medida ou modelo. | Para anunciar Goodyear 195/55 R15, obter uma foto autorizada da peça correta, isolada em fundo neutro e com modelo/medida conferidos. |
| `public/images/produtos/placeholder.svg` | Ilustração vetorial de fallback, não é fotografia de produto. | Nenhuma ação; permanece fallback. |

Os arquivos locais não incluem fotografias de pastilha Bosch, óleo Mobil ou bateria Moura. O catálogo e os serviços mostram que `imagem_url` vem dos registros Supabase, sem mapeamento estático. A consulta somente de leitura aos registros ativos falhou neste ambiente por `fetch failed`; portanto não foi possível verificar as URLs atuais nem conferir visualmente pastilha Bosch, óleo Mobil, filtro Tecfil, pneu e bateria no catálogo remoto. Nenhuma imagem, registro ou URL foi alterado.

Os fundos brancos/retangulares que já estejam dentro de uma URL cadastrada continuarão visíveis, embora o palco quase branco reduza a diferença. Remover o fundo exigiria preparar uma versão nova e revisar seu conteúdo/licença; não fiz remoção automática de fundo, recorte ou retoque que pudesse apagar rótulos, marcas ou características das peças. Para as imagens exatas que ainda precisem tratamento, usar os nomes dos produtos e os arquivos recomendados na tabela após obter as imagens autorizadas.

## Escopo preservado

O componente `ProductImage` e o fluxo de upload continuam intactos. Preços, descrições, categorias, estoque, Supabase, RLS, carrinho e avaliações não foram alterados.
