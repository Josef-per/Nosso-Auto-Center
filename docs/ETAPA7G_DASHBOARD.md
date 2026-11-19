# Etapa 7G — dashboard administrativo

## Entrega

Administração agora tem navegação interna por âncoras: **Visão geral**, **Produtos** e **Pedidos**. Busca, Situação, cadastro/edição/desativação, modal, URL/upload de imagem, entrega, itens e transições de status foram preservados. Um alerta de estoque abre o mesmo editor existente. Mudanças bem-sucedidas de produto/status recarregam os dados; ao retornar à Visão geral, a RPC de métricas é consultada novamente.

A Visão geral exibe sete cards, série diária com período selecionável, distribuição de atendimento, ranking por unidades, alertas de estoque e cinco pedidos recentes. O aviso **Dados demonstrativos — pagamentos simulados** permanece visível em todas as seções.

Os gráficos usam SVG/CSS e tabela diária acessível. Não há biblioteca gráfica nem nova dependência de produção. PGlite é uma dependência exclusivamente de desenvolvimento para testar o SQL em PostgreSQL/WASM local e isolado; não entra no bundle do site.

## Fonte e escopo das métricas

O código foi confrontado com os contratos existentes em `revisao-etapa5/02_administracao.sql`, `revisao-etapa6/01_dados_entrega_admin.sql`, `revisao-etapa5/01_checkout_corrigido_v2.sql` e `migrations/001_catalogo.sql`. Não houve conexão de gerenciamento para inspecionar o banco remoto. A migração verifica os nomes/tipos utilizados em `information_schema` e interrompe se o esquema remoto for incompatível.

Todos os cards, distribuição de status, ranking e estoque representam **todo o histórico**. O seletor **Intervalo do gráfico** altera somente a série temporal; os escopos estão identificados na interface.

| Indicador | Cálculo na RPC |
| --- | --- |
| Valor dos pedidos | Soma de `pedidos.total` onde o status é diferente de cancelado, incluindo total antigo e frete quando presente no total. Não representa receita recebida. |
| Total de pedidos | Contagem de todos os registros, incluindo cancelados. |
| Ticket médio | Média dos totais não cancelados; zero quando não há elegíveis. Totais nulos são tratados como zero, inclusive no denominador. |
| Pendentes/cancelados | Contagem por `pedidos.status`, que representa atendimento. |
| Produtos ativos | Contagem de `produtos.ativo = true`. |
| Estoque em atenção | Produtos ativos com estoque zero ou entre 1 e 5, com contagens separadas. Inativos ficam fora dos alertas. |
| Pagamento sem identificação | Contagem de `status_pagamento IS DISTINCT FROM 'simulado'`, incluindo NULL dos pedidos antigos; nunca classificada como pagamento confirmado. |
| Produtos mais vendidos | Junção de `pedido_itens` com pedidos não cancelados, soma de quantidades agrupadas por produto, cinco primeiros. Nome atual quando disponível; snapshot do item se o produto não estiver mais disponível. |

`admin_dashboard(p_dias integer DEFAULT 30)` aceita apenas **7**, **30** ou **NULL** (completo). Os últimos 7/30 dias incluem hoje, em `America/Sao_Paulo`. A consulta usa limites de meia-noite nessa zona e gera todas as datas, preenchendo quantidade/valor com zero nos dias sem pedidos elegíveis. Não converte a data diária ISO em meia-noite do navegador, evitando deslocamento de dia.

O período completo vai da primeira data registrada até hoje (ou até a maior data registrada, se houver registros futuros). Sem pedidos, retorna um dia com zero e estado vazio. O gráfico não insere pontos ou vendas fictícias. Quando há um único dia, exibe apenas seu ponto, sem inventar área entre dias inexistentes.

A RPC agrega diretamente as tabelas, sem limite de 100 pedidos. A seção Pedidos mantém o contrato existente de **até 100 pedidos recentes** e informa esse limite. A Visão geral usa apenas cinco desses registros no acompanhamento recente, sem detalhes pessoais. Comparações entre telas durante alterações concorrentes devem usar **Atualizar dados** e observar o horário de geração das métricas.

## Migração manual e segurança

Arquivo: `supabase/revisao-etapa8/01_dashboard_admin.sql`.

1. Antes de aplicar, revise o esquema real, as etapas 5/6 e as definições de `public.exigir_admin()`/`public.usuario_admin()`. Confirme especialmente `pedidos.criado_em` como `timestamptz` e os demais tipos listados no guard da migração.
2. Revise e execute a migração manualmente em homologação primeiro. Nenhuma execução remota foi feita nesta etapa.
3. A função usa `SECURITY DEFINER`, `SET search_path = ''`, referências de tabelas qualificadas e `public.exigir_admin()` antes de consultar dados. EXECUTE é revogado de PUBLIC/anon e concedido a authenticated, que ainda precisa passar pela verificação de administrador no servidor.
4. A migração não modifica pedidos, usuários, perfis, produtos, RLS ou permissões de leitura direta. Não utiliza `service_role` no frontend.
5. O JSON contém somente métricas, datas e identificadores/nomes de produtos. Não contém comprador, usuário, e-mail, CPF, telefone ou endereço. Os detalhes administrativos existentes de entrega permanecem na RPC protegida de pedidos.
6. Se a RPC ainda não existir, **Métricas indisponíveis** orienta aplicar manualmente a migração. Produtos e Pedidos continuam acessíveis. Nenhum total é estimado a partir dos 100 pedidos disponíveis.

Consultas equivalentes e inspeção de privilégios estão em `supabase/revisao-etapa8/02_verificacao_dashboard.sql`, arquivo somente de leitura. Compare somas/médias com precisão numérica antes do arredondamento visual para centavos. No SQL Editor, as consultas equivalentes podem ser executadas como manutenção autorizada; chamar a RPC sem contexto de usuário administrativo deve falhar, mesmo com uma sessão SQL diferente de um login da aplicação.

## Verificação executada

- Teste da migração real em PGlite com as funções de autorização extraídas do SQL existente do projeto, tabelas/roles e registros exclusivamente de teste. Foram verificados anon negado, cliente negado, admin permitido, ausência de leitura direta de pedidos e preservação de RLS.
- Mais de 100 pedidos no teste: totais globais não truncados, cancelados excluídos de valores/ranking, pedido antigo sem pagamento informado, estoque 0/5/6 e produto inativo, datas dos dois lados da meia-noite de São Paulo, dias sem movimento, período completo e alteração local de status recalculando agregados.
- Comparação dos indicadores com consultas SQL equivalentes; nenhuma chamada remota ou alteração de registros reais.
- Testes React/DOM: proteção da rota para cliente, sete cards, navegação interna, períodos 7/30/completo, atualização após status, mensagem de RPC ausente e manutenção do acesso a Produtos.
- Os testes anteriores de CRUD, preview e upload de imagens, retry sem upload duplicado e preservação de imagem continuam na suíte.
- Prévia visual temporária e isolada, com dados fictícios identificados como teste: desktop claro, mobile de 390px escuro, navegação, seletor de período, edição rápida e categoria no modal. Sem overflow da página e sem erros/avisos de console nessa prévia. A tabela conserva sua rolagem horizontal interna. Os arquivos temporários de prévia foram removidos.
- Verificação final: `pnpm.cmd lint` aprovado; `pnpm.cmd build` aprovado; `pnpm.cmd test` com **25 testes aprovados e zero falhas**.

## Roteiro de homologação no Supabase real

1. Revise e aplique manualmente a migração em homologação. Abra `/admin` como cliente: deve ver Acesso restrito. Confirme também que a chamada direta da RPC com a sessão desse cliente falha; um anon deve não ter EXECUTE. Não basta esconder a navegação no frontend.
2. Entre como administrador. Compare os sete cards e a distribuição com `02_verificacao_dashboard.sql`. Confira a quantidade total mesmo se houver mais de 100 pedidos.
3. Confira pedidos cancelados fora do valor, ticket e ranking. Confira pedidos antigos com pagamento ausente como não informado, sem aprovação financeira. Não deve aparecer receita recebida ou crescimento inventado.
4. Selecione 7 dias, 30 dias e completo. Confira o início/fim em São Paulo, datas próximas à meia-noite, dias vazios com zero e totais da tabela diária. Os demais cards devem permanecer globais.
5. Em ambiente descartável/contas de teste, confira ausência de pedidos/itens, um único pedido e estoque sem alertas. Não apague dados reais para produzir um estado vazio.
6. Abra Produtos, teste busca/Situação, cadastro, alteração, desativação, URL de imagem e upload. Abra um produto pelo alerta de estoque e confirme que é o mesmo editor. Alterar estoque e salvar deve atualizar o card e os alertas.
7. Abra Pedidos, filtre cada status, consulte comprador/entrega/itens/totais e confirme a indicação de pagamentos simulados. Em pedido de teste autorizado, faça transição permitida e volte à Visão geral: totais/status/ranking devem ser atualizados. Cancelamentos permanecem sujeitos à confirmação e às regras anteriores de reposição/auditoria.
8. Confira retry em falha de rede e RPC ausente sem bloquear Produtos/Pedidos. Verifique claro/escuro, 390px/desktop, teclado nos selects, foco, rolagem de tabela, categoria em modal e `prefers-reduced-motion`.

Os passos que alteram dados são para execução **manual em homologação**, com dados de teste autorizados. Não foram executados em contas ou pedidos reais durante a implementação.

## Arquivos desta etapa

- `src/pages/Admin.jsx`: navegação e integração com o dashboard, mantendo CRUD.
- `src/admin/AdminDashboard.jsx`: cards, status, ranking, estoque e pedidos recentes.
- `src/admin/OrdersChart.jsx`, `src/admin/dashboardUtils.js`: gráfico, tabela acessível e datas de São Paulo.
- `src/admin/OrderManager.jsx`: filtro consistente, valores de produtos/frete, datas e bloqueio de envio simultâneo.
- `src/services/adminService.js`: RPC de métricas, validação de período/retorno e erro específico de migração ausente.
- `src/css/redesign.css`: estilos responsivos nos dois temas.
- `supabase/revisao-etapa8/01_dashboard_admin.sql`, `02_verificacao_dashboard.sql`: migração manual e conferência somente de leitura.
- `tests/dashboard-sql.test.mjs`, `tests/dashboard-ui.test.mjs`: testes PostgreSQL/React.
- `package.json`, `pnpm-lock.yaml`: PGlite somente como dependência de desenvolvimento.
- Este relatório.

As alterações locais das etapas anteriores foram preservadas. Não houve migração remota, mudança de usuários/pedidos reais, commit, push, merge ou deploy.
