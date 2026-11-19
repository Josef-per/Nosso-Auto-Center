# Etapa 7C — redesign do Nosso Auto Center

Implementação local na branch `feat/design-final`, em 18/11/2026. Sem commit, push, merge, deploy ou execução de SQL. Checkout, estoque, cálculos, contratos de RPC, autenticação Supabase e autorização da rota administrativa foram preservados. A única extensão no retorno de acesso permite voltar a uma URL interna de produto para avaliar a peça.

## Design e cobertura

- Tokens extraídos de `global.css` para `tokens.css`: paleta laranja/grafite, superfícies de ambos os temas, estados, sombras, raios, espaçamento e transições. Texto escuro nos botões laranja; logo oficial com as cores originais.
- Manrope na interface e Space Grotesk nos títulos. Duas fontes variáveis WOFF2 locais, cerca de 47 KB no total, `font-display: swap`, preload e licenças SIL OFL incluídas. Sem dependência de fontes em tempo de navegação.
- Header com contato/localidade, navegação ativa, menu mobile com Escape e foco; rodapé com composição em colunas, contatos do arquivo antigo e identificação da loja demonstrativa.
- Home 7A/7A.1 preservada e ampliada com apresentação institucional, galeria e diferenciais verificáveis. Serviços continuam em `/#servicos`, com os sete serviços existentes. Nova rota `/sobre`, com história e contato, sem nova página desnecessária de serviços.
- Loja com busca destacada, filtros reais de categoria/marca/disponibilidade/preço, chips removíveis, ordenação e painel recolhível no mobile. Uma única rotina de filtragem. Categorias da Home abrem a loja filtrada; busca e categoria ficam na URL. A busca não reinicia o scroll da página a cada tecla.
- Cards com tipografia, preços, disponibilidade e compra mais claros; feedback de adição; produto sem estoque continua bloqueado. Skeletons no catálogo e na Home.
- Produto com imagem enquadrada, estoque, quantidade, descrição, informações de compatibilidade e natureza demonstrativa da compra. Não foi criada galeria de miniaturas: o esquema atual fornece apenas uma imagem por produto.
- Carrinho com linhas, quantidades, subtotais, resumo e estados vazios refinados. Checkout com identificação visual das etapas, agrupamento dos campos e seleção de Pix, boleto e cartão. Nenhuma informação real de cartão é solicitada.
- Conta com identificação e navegação para dados pessoais/pedidos, cards e badges. Link administrativo visível somente após resposta `true` da mesma RPC `usuario_admin` usada na rota. Erro de verificação não revela o link.
- Administração com imagens, badges, busca e filtro ativo/inativo/sem estoque; modal existente refinado; pedidos filtráveis por etapa, dados de entrega organizados e feedback de atualização. Mantidas as transições de status autorizadas pelo backend.
- Login, cadastro, confirmação, página 404, estados de carregamento, erro e vazio usam a mesma linguagem visual. Error boundary de rota evita página em branco em falhas de renderização/carregamento de módulos.
- Microinterações CSS em botões, ícones, cards, menu e modal. Scroll nativo, foco visível, controles semânticos, nenhuma biblioteca de animação, parallax ou `transition: all`. Regras de movimento reduzido desativam animações/transições/scroll suave e elevações.

## Avaliações reais

Componentes, serviço e migração independentes implementados. Nota de 1–5, comentário opcional de até 1.000 caracteres, resumo calculado, paginação de 8 registros, criação/edição/remoção da avaliação própria e tratamento de banco ainda sem migração. Estrelas fracionárias representam a média recebida; nenhum dado de avaliação foi criado no Supabase.

A tabela tem FK para produto/Auth, checks, unicidade por produto/usuário e RLS. O banco define o autor com `auth.uid()`; grants por coluna impedem o cliente de fornecer autoria, IDs ou datas e limitam UPDATE à nota/comentário. Trigger protege identificadores imutáveis. Leitura direta só da avaliação própria; RPC pública retorna nota/comentário/datas/UUID da avaliação, sem UUID de usuário, perfil ou e-mail. Comentários são renderizados como texto React, e a interface orienta a não incluir dados pessoais.

**Pendente:** revisar e aplicar manualmente [01_avaliacoes.sql](../supabase/revisao-etapa7/01_avaliacoes.sql), primeiro em ambiente de teste, e executar a matriz de segurança no [README da migração](../supabase/revisao-etapa7/README.md). A migração não foi executada, nem mesmo automaticamente em banco de teste. A validação de RLS depende dessa etapa. Não há moderação administrativa ou verificação de compra; esses recursos não foram prometidos pela interface.

## Imagens e conteúdo

Nova imagem de produção: `public/images/empresa/servicos-oficiais.jpg`, 1200 × 675, aproximadamente 157 KB. Conversão otimizada do material oficial já existente em `oficina.jpg`, sem inventar fotografias. A imagem contém uma composição institucional, explicitamente identificada como tal na galeria. JPEG foi usado com o codificador nativo disponível; não foi instalado conversor para WebP/AVIF.

Reutilizadas a logo e as duas fachadas já otimizadas em 7A. As imagens fora do hero têm lazy loading, dimensões/proporções e textos alternativos. Removida a fotografia externa genérica do painel de login; ele usa a fachada real. Não foram baixadas fotos complementares nem usados os arquivos genéricos `servicos.png`/`historia.png` como fotos da empresa.

História: `AutoCenter-antigo/index.html` (inauguração em 03/01/2018 e fundadores). Contatos: `AutoCenter-antigo/Contato.html` (Av. Paulo VI, 2003, Jardim Alvorada, Franca; telefones e e-mail). Não foram transcritos contadores de clientes, promoções antigas, depoimentos, prêmios, certificações ou estimativas de vendas. Instagram omitido por não haver confirmação direta suficientemente clara no material.

Os contatos foram confirmados no material fornecido, sem verificação operacional por ligação ou mensagem. O acervo não contém uma série independente de fotos internas claramente identificadas; a galeria usa a fachada e o material institucional oficial disponível. Fotos internas adicionais podem enriquecer essa seção futuramente.

### Imagens de produtos pendentes

No catálogo consultado durante a revisão, os oito itens usavam o placeholder. Nenhum URL do Supabase foi alterado. Associar somente fotos autorizadas do item correto, com aplicação/especificação conferida:

| ID | Produto | Marca |
| --- | --- | --- |
| 1 | Pastilha de freio dianteira | Bosch |
| 2 | Óleo sintético 5W30 | Mobil |
| 3 | Filtro de óleo automotivo | Tecfil |
| 4 | Pneu aro 15 - 195/55 R15 | Goodyear |
| 5 | Bateria automotiva 60Ah | Moura |
| 6 | Farol de LED premium H7 | Philips |
| 7 | Jogo de discos de freio ventilados | Bosch |
| 8 | Kit de filtros para revisão | Tecfil |

É possível hospedar as fotos autorizadas em Supabase Storage e preencher `imagem_url` pelo editor administrativo existente, usando as permissões já configuradas. Não foram criados buckets, permissões públicas nem credenciais privilegiadas.

## Verificação

- Builds após os blocos compartilhado/institucional, catálogo/produto, conta/compra, administração e avaliações: aprovados.
- `pnpm.cmd lint`: aprovado.
- `pnpm.cmd build`: aprovado. CSS final cerca de 65 KB, 13 KB gzip; avaliações ficam no chunk de produto. Nenhuma dependência ou lockfile alterado.
- `pnpm.cmd test`: **13 testes aprovados**, incluindo os nove existentes. Adicionados testes para filtros combinados sem mutação, validação de avaliações, limite Unicode, ausência da RPC, falhas, duplicidade, payload sem autoria e allowlist de retorno ao produto.
- `git diff --check`: aprovado.

Foi usado o `pnpm.cmd` 10.34.9 do cache local; o launcher global ficou aguardando resolução pela rede. Não houve atualização de dependências.

### Navegador — dados reais e cenário isolado

Catálogo real: oito itens consultados, busca por filtro, Bosch combinado com estoque, ordenação por preço, chips/limpeza e bloqueio do produto sem estoque. Produto real: dados, fallback de imagem, avaliações indisponíveis sem migração e adição ao carrinho com feedback/subtotal. Home, categorias, serviços, Sobre, acesso, cadastro, rodapé e 404 conferidos.

Telas protegidas foram exercitadas com um harness **temporário, local e identificado como QA com dados fictícios**, com respostas Supabase substituídas apenas nesse cenário. Ele foi removido antes da entrega e não integra a aplicação nem o build. Foram conferidos:

- Cliente sem link administrativo; administrador com link; rota administrativa negada ao cliente.
- Dados pessoais, salvamento e histórico de pedidos.
- Carrinho autenticado, checkout, campos, erro de CPF, seleção de cartão, frete de SP, subtotal/total e navegação à confirmação de pedido.
- Tabela/modal de produto, foco inicial no nome e retorno ao botão de edição; mudança de status com mensagem de sucesso e próxima ação permitida.
- Avaliações vazias, publicação, média/contagem, edição e remoção em memória, sem nenhuma gravação no Supabase.

Home, loja, produto/avaliações, conta, checkout, administração, login, cadastro, Sobre, carrinho vazio, confirmação e 404 foram conferidos nas larguras **360, 390, 768, 1024 e 1440 px**, sem overflow horizontal observado. A tabela administrativa mantém rolagem dentro do contêiner quando necessário. Conferidos temas claro/escuro, menu mobile e Escape/retorno de foco. Âncora de Serviços estabilizou em aproximadamente 122 px, abaixo do Header mobile de aproximadamente 107 px, após o catálogo carregar.

As regras de `prefers-reduced-motion` foram revisadas no CSS; **não houve emulação da preferência no navegador**. Não foi feita auditoria WCAG completa nem benchmark Lighthouse/CLS. Dimensões de imagens e skeletons reduzem deslocamentos, sem promessa de CLS zero.

O catálogo não apresentou erros de console na conferência. Durante o QA houve uma falha transitória de importação dinâmica causada por conflito de cache Vite com os servidores SSR dos testes; a revisão prosseguiu com cache separado. A RPC de avaliações ausente pode produzir uma resposta HTTP de recurso não encontrado no servidor ainda sem migração; a UI trata esse caso e mantém o produto funcional.

**Ainda requer validação integrada:** login/cadastro com contas reais de teste, persistência autenticada de perfil/carrinho/pedidos, CRUD administrativo contra o backend e políticas RLS de avaliações após aplicar SQL. Os testes com mocks validam interface/contratos; não demonstram execução das políticas no PostgreSQL. Nenhuma conta foi criada, nenhum pedido real foi registrado e nenhum produto real foi editado nos testes.

O backend atual não fornece um histórico de mudanças de status separado; foram mantidos os dados disponíveis sem inventar eventos ou ampliar a estrutura de pedidos. Avaliações administrativas eram opcionais e não foram adicionadas.

## Evidências visuais

- [Home desktop clara](etapa7-evidencias/home-desktop-claro.jpg)
- [Home desktop escura](etapa7-evidencias/home-desktop-escuro.jpg)
- [Home mobile clara](etapa7-evidencias/home-mobile-claro.jpg)
- [Catálogo desktop escuro](etapa7-evidencias/catalogo-desktop-escuro.jpg)
- [Rodapé no celular](etapa7-evidencias/rodape-escuro.jpg)

Para revisar localmente: execute `pnpm.cmd dev --host 127.0.0.1` na raiz do projeto e abra a URL indicada pelo Vite. Não é necessário publicar para aprovar o design.

Os servidores temporários das portas 5174–5176 foram encerrados, e a configuração isolada de QA foi removida. A prévia que já existia na porta 5173 não foi encerrada por esta tarefa.

## Novos componentes e módulos

- `AdminEntry`: visibilidade administrativa pela autorização existente.
- `SobreEmpresa`, `GaleriaEmpresa`, `ConfiancaEmpresa`, `ContatoEmpresa`: conteúdo institucional reutilizado.
- `ProductSkeleton`: carregamento do catálogo e Home.
- `ProductReviews`: resumo, comentários e formulário de avaliação.
- `RouteErrorBoundary`: fallback de falhas de rota/renderização.
- Página `Sobre`, conteúdo centralizado `empresa`, rotina `filtrarProdutos`, validação `avaliacoes` e serviço `avaliacaoService`.

## Referências técnicas e licenças

- [SIL OFL — Manrope](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt) e [Space Grotesk](https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/OFL.txt); cópias distribuídas em `public/fonts`.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [PostgreSQL GRANT por coluna](https://www.postgresql.org/docs/current/sql-grant.html).

## Arquivos modificados/adicionados

- `docs/ETAPA7C_ENTREGA.md`
- `docs/etapa7-evidencias/catalogo-desktop-escuro.jpg`
- `docs/etapa7-evidencias/home-desktop-claro.jpg`
- `docs/etapa7-evidencias/home-desktop-escuro.jpg`
- `docs/etapa7-evidencias/home-mobile-claro.jpg`
- `docs/etapa7-evidencias/rodape-escuro.jpg`
- `index.html`
- `public/fonts/manrope-OFL.txt`
- `public/fonts/manrope.woff2`
- `public/fonts/space-grotesk.woff2`
- `public/fonts/spacegrotesk-OFL.txt`
- `public/images/empresa/servicos-oficiais.jpg`
- `src/App.jsx`
- `src/admin/OrderManager.jsx`
- `src/auth/AdminEntry.jsx`
- `src/auth/destinoAcesso.js`
- `src/catalogo/filtrarProdutos.js`
- `src/checkout/CheckoutForm.jsx`
- `src/components/AdicionarAoCarrinho.jsx`
- `src/components/CategoryCard.jsx`
- `src/components/EmpresaSections.jsx`
- `src/components/Footer.jsx`
- `src/components/Header.jsx`
- `src/components/Layout.jsx`
- `src/components/Navegacao.jsx`
- `src/components/ProductCard.jsx`
- `src/components/ProductFilters.jsx`
- `src/components/ProductReviews.jsx`
- `src/components/ProductSkeleton.jsx`
- `src/components/RouteErrorBoundary.jsx`
- `src/components/StatusPedido.jsx`
- `src/content/empresa.js`
- `src/css/fonts.css`
- `src/css/global.css`
- `src/css/redesign.css`
- `src/css/tokens.css`
- `src/lib/avaliacoes.js`
- `src/main.jsx`
- `src/pages/Acesso.jsx`
- `src/pages/Admin.jsx`
- `src/pages/Carrinho.jsx`
- `src/pages/Checkout.jsx`
- `src/pages/Home.jsx`
- `src/pages/Loja.jsx`
- `src/pages/MinhaConta.jsx`
- `src/pages/PedidoConfirmado.jsx`
- `src/pages/Produto.jsx`
- `src/pages/Sobre.jsx`
- `src/seo/metadados.js`
- `src/services/avaliacaoService.js`
- `supabase/revisao-etapa7/01_avaliacoes.sql`
- `supabase/revisao-etapa7/README.md`
- `tests/etapa7.test.mjs`
