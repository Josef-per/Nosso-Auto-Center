# Etapa 7D — legibilidade, navegação e polimento

Data: 19/11/2026. Branch: `feat/design-final`.

## Alterações

- Navegação principal com “Início”. Serviços permanece em `/#servicos`, com os sete serviços informativos existentes.
- A Home concentra o posicionamento de Serviços: aguarda o catálogo terminar, posiciona uma vez por navegação e move o foco sem uma segunda rolagem. Cliques repetidos e retorno de outras páginas também funcionam.
- Rolagem suave nativa em navegação explícita; chegada direta/histórico e preferência por movimento reduzido usam posicionamento imediato.
- Altura real do Header medida com ResizeObserver e sincronizada antes da pintura ao abrir/fechar o menu. A margem das âncoras acompanha o Header, inclusive quando a faixa superior quebra em duas linhas.
- Texto comum em 16px; navegação em 16px; ações do Header em 14px; benefícios em 18px/16px; produtos em 18px, marcas em 15px, categoria e estoque em 14px. Formulários, mensagens, avaliações e administração recebem revisão dos estilos específicos.
- Regras tipográficas alteradas na origem; removidas declarações responsivas de tamanho que ficaram iguais às regras base. Logo, badges e números de destaque mantêm suas escalas próprias.
- Filtros com grupos de 16px, opções de 15px, busca de 16px, radios/checkboxes maiores, áreas clicáveis e foco visível. Faixa de preço com trilha de progresso e puxador nos dois temas, incluindo estilos para Firefox.
- Chips ativos com contraste laranja, quebra de texto e botão de remoção estável; ordenação adapta-se à largura disponível.
- Botões primários, secundários, ghost, destrutivos e desabilitados com aparência coerente nos dois temas. Alterações em avaliações e administração limitadas às classes de apresentação dos botões destrutivos.
- Menu móvel também disponível no tablet; cards em uma coluna até 520px; benefícios em uma coluna nessa faixa. Fontes de leitura não são reduzidas no mobile.

## Arquivos modificados

| Arquivo | Alteração |
| --- | --- |
| `src/components/Header.jsx` | Medição da altura e sincronização com o menu |
| `src/components/Layout.jsx` | Remove posicionamento concorrente de Serviços |
| `src/components/Navegacao.jsx` | Texto Início |
| `src/components/ProductFilters.jsx` | Progresso visual do range de preço |
| `src/components/ProductReviews.jsx` | Classes dos botões de remoção |
| `src/admin/OrderManager.jsx` | Classes dos botões de cancelamento |
| `src/pages/Admin.jsx` | Classes dos botões de desativação |
| `src/pages/Home.jsx` | Âncora após estabilizar o catálogo |
| `src/pages/NaoEncontrada.jsx` | Link de retorno para o início |
| `src/css/global.css` | Tipografia base e componentes comuns |
| `src/css/estrutura.css` | Texto das ações do Header |
| `src/css/home.css` | Benefícios, textos e cards da Home |
| `src/css/comercio.css` | Feedback e avisos de estoque legíveis |
| `src/css/pedidos.css` | Erros, pagamento e dados de entrega legíveis |
| `src/css/redesign.css` | Escalas específicas, controles, botões e responsividade |
| `docs/etapa7d-validacao.md` | Este relatório |

`tokens.css` foi inspecionado; os tokens existentes de cor, estado e movimento foram reutilizados.

## Validação

| Verificação | Resultado |
| --- | --- |
| `pnpm.cmd lint` | Aprovado, código de saída 0 |
| `pnpm.cmd build` | Aprovado, código de saída 0 |
| `pnpm.cmd test` | 13 aprovados, 0 falhas |
| Temas claro e escuro | Conferidos no navegador, em desktop/tablet/mobile |
| Larguras 360, 390, 768, 1024 e 1440px | Sem overflow horizontal nas páginas públicas verificadas |
| Páginas verificadas nas cinco larguras | Home, Loja, Produto, Sobre nós, Login, Cadastro e Carrinho vazio |
| Serviços pela Home | Hero e navegação, incluindo novo clique no mesmo destino |
| Serviços pela Loja | Menu móvel, seção correta e foco em `servicos` |
| Serviços pelo Produto | Rodapé e ativação por teclado, seção correta e foco |
| Header cobrindo o destino | Não ocorreu: no mobile a seção ficou em aproximadamente 150px, com Header de 134px (16px de margem) |
| Filtros combinados | Freios + Bosch + estoque + busca “pastilha” + ordenação por menor preço: 1 produto |
| Preço e estado vazio | Limite em R$ 0,00: nenhum produto; limpeza restaurou os 8 produtos |
| Painel mobile | Abrir/fechar, controles e limpeza conferidos |
| Console após correções | Sem erros ou avisos na nova aba de validação, incluindo trocas de rota e menu |
| Movimento reduzido | Condição da âncora e regras CSS inspecionadas; preferência do sistema não foi alterada |

O catálogo real do Supabase foi consultado apenas para leitura. A suíte existente também cobre carrinho, estoque, autenticação de retorno, avaliações, frete e pagamentos demonstrativos. Não foram criados usuários, produtos ou pedidos.

## Pendências e limites da conferência

- Checkout, Minha Conta e Administração receberam os ajustes de CSS, mas a conferência visual autenticada permanece pendente: o navegador estava sem sessão e não foram criadas contas nem alteradas permissões.
- O Carrinho foi conferido vazio; a apresentação com itens e as telas de pedidos precisam de uma conferência visual com dados/sessão apropriados. Os testes automatizados existentes de carrinho e pedidos passaram.
- O catálogo mostrou o fallback existente de imagem indisponível em produtos sem imagem; não houve substituição de dados dinâmicos.
- Estilos de range para Firefox foram incluídos, mas a conferência visual ocorreu no navegador Chromium integrado.

Não houve alteração em Supabase, RPCs, RLS, banco, migrações, regras de autenticação, estoque, checkout, pagamentos ou operações de avaliações/pedidos. Sem commit, push, merge ou deploy.
