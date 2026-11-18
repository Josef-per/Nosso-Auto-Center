# Etapa 6 — correções e entrega

## O que mudou

- Modal nativo reutilizável em src/components/Modal.jsx. Abre o editor acima da página, contém o foco pelo dialog.showModal(), bloqueia o fundo e sua rolagem, foca o primeiro campo e retorna ao botão de origem. Escape, X e Cancelar passam pela confirmação de descarte quando há alterações; durante salvamento ficam bloqueados. Recarregar/fechar a aba também solicita o aviso nativo se houver edição/salvamento. O aviso de descarte mantém os dados ao continuar editando. Navegação pelo histórico do navegador precisa ser conferida manualmente; não há bloqueador global de rotas.
- src/admin/ProductEditor.jsx preserva campos, validações e RPC de gravação. src/pages/Admin.jsx mantém a listagem montada ao recarregar para preservar o botão de origem e o foco. Não há exclusão física de produtos ou pedidos.
- src/pages/Carrinho.jsx conclui a quantidade no blur ou Enter. Não há gravação por tecla nem botão Atualizar. Durante a requisição, o provider existente bloqueia outras escritas. Valores inválidos e falhas restauram o valor confirmado; os serviços continuam consultando preços e estoque reais. Remover mantém seu fluxo e evita iniciar uma gravação de quantidade ao receber foco/toque. src/components/CampoQuantidade.jsx passou a aceitar eventos e mensagens acessíveis.
- src/components/PaymentSummary.jsx e src/lib/pagamentoDemonstrativo.js unificam as mensagens por modalidade. Usados na confirmação, histórico e administração. A lista de pedidos do cliente consulta o método persistido, com compatibilidade para colunas ausentes. Atendimento e status financeiro aparecem separados. Nenhuma coleta financeira ou cobrança foi adicionada.
- src/admin/DeliveryDetails.jsx acrescenta Dados de entrega expansíveis. O SQL incremental é opcional para carregar esses campos; sem ele, a listagem continua funcional com uma mensagem de indisponibilidade. Nome e telefone são atuais do perfil; endereço é o salvo no pedido.
- Header e Footer já compartilham LinksNavegacao e apontam Serviços para /#servicos, existente na Home e com foco/rolagem no Layout. O título da seção passou a h2 e o texto esclarece o contato com a equipe, sem inventar serviços ou criar um novo painel.

## SQL manual

Revise e aplique somente supabase/revisao-etapa6/01_dados_entrega_admin.sql conforme o README da mesma pasta. Não reaplique a etapa 5. A RPC conserva a verificação administrativa no banco e os campos anteriores; acrescenta apenas nome, telefone e campos postais permitidos. Não há alteração de tabela, permissão pública ou inclusão de CPF.

Nenhum SQL foi executado pelo agente. O relato do responsável confirma os testes remotos da etapa 5; ele não é um novo teste remoto das mudanças da etapa 6.

## SEO e SEM acadêmico

index.html inclui título, descrição, Open Graph e Twitter Card sem avaliações inventadas ou imagens sem licença. src/seo/RouteMetadata.jsx atualiza títulos e descrições conforme a navegação; produtos usam nome/descrição reais quando carregados e ficam noindex em erro ou ausência. Conta, login, cadastro, carrinho, checkout, confirmação e admin recebem noindex no cliente. vercel.json acrescenta X-Robots-Tag nas rotas privadas para que a resposta HTTP também informe noindex mesmo sem JavaScript.

public/robots.txt permite rastreamento: não bloqueia rotas privadas no arquivo, para que os mecanismos possam ler o noindex. Controle de indexação não substitui autenticação/RLS. Não foi gerado sitemap ou canonical com um domínio presumido. Após confirmar o domínio oficial, criar sitemap somente para /, /loja e produtos ativos, com rotina para mantê-lo atualizado. Uma SPA pode ter limitações de prévias em compartilhadores que não executam JavaScript: eles receberão os metadados gerais do HTML; prévias específicas por produto exigiriam renderização/pré-renderização futura.

Para SEM acadêmico, preparar apenas uma proposta: grupos por categorias reais do catálogo; exemplos de termos como autopeças, pastilhas de freio e filtros automotivos; exemplos de anúncios que levem à categoria/produto correspondente; hipótese de orçamento e métricas como CTR, CPC e conversão. Identificar valores como hipóteses, excluir páginas internas e compras de teste das análises e não anunciar processamento financeiro real. Nenhuma campanha, conta de anúncios, rastreador ou gasto foi criado.

Referências: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog e https://developers.google.com/search/docs/crawling-indexing/block-indexing.

## Validação local

Sem instalar novas dependências:

~~~powershell
node --test tests/*.test.mjs
node node_modules/eslint/bin/eslint.js .
node node_modules/vite/bin/vite.js build
git diff --check
node node_modules/vite/bin/vite.js --host 127.0.0.1
~~~

Use a URL local informada pelo Vite. O projeto fixa pnpm 10.34.9; antes de usar pnpm.cmd test/lint/build/dev, confirme a versão do gerenciador. O pnpm global 12 apresentou problemas nas etapas anteriores. Os comandos Node acima usam as dependências já instaladas e evitam esse problema. Não altere o lockfile para executar testes.

Checklist manual com contas já autorizadas, em homologação:

1. Admin: abrir Novo produto e Editar. Tab/Shift+Tab ficam no modal. Testar X, Escape, Cancelar, aviso de descarte e retorno ao botão de origem; durante salvar, o fechamento fica bloqueado. Confirmar cadastro, edição e desativação persistidos após recarregar, sem repetir escritas se houver erro de rede.
2. Carrinho visitante e autenticado: digitar mais de um dígito sem gerar uma requisição por tecla; sair do campo/Enter grava uma vez e atualiza totais e contador. Testar vazio, zero, decimal, limite e estoque insuficiente. Simular falha de rede: valor confirmado deve reaparecer com aviso. Testar Remover logo após editar a quantidade e tentativas rápidas em itens distintos.
3. Checkout: testar Pix, Boleto e Cartão com os dados acadêmicos autorizados. Conferir método no banco, na confirmação, Minha Conta e admin. Status financeiro segue simulado em todas as etapas de atendimento. CPF inválido/repetido, CEP curto/inexistente, correção de endereço e falta de estoque devem manter seus bloqueios.
4. Aplicar o novo SQL somente após revisão. Testar Dados de entrega antes e depois, inclusive pedido antigo sem telefone/nome. Cliente comum não deve conseguir chamar a RPC admin diretamente; visitante não possui EXECUTE.
5. Acessar Serviços pelo cabeçalho/rodapé na Home e em outra rota, inclusive menu móvel. Deve chegar a /#servicos e focar/rolar a seção.
6. Testar 360 px, 768 px e desktop em ambos os temas: modal longo com rolagem interna, formulários, foco, tabelas com rolagem interna e ausência de overflow na página.
7. Conferir títulos e description por rota no DOM, noindex nas privadas e, na Vercel, X-Robots-Tag na resposta HTTP. Em rotas profundas, atualizar o navegador e confirmar o fallback da SPA.

Os testes automatizados exercitam regras de CPF/CEP/frete/endereço, componentes de pagamento/entrega, indexação e serviços do carrinho com armazenamento e respostas do Supabase controlados. Não validam o comportamento nativo do modal em navegadores reais, RLS remoto, transações SQL ou compras em produção.

## Publicação posterior na Vercel — somente pelo responsável

1. Rever as alterações locais acumuladas das etapas 4–6 e o SQL adicional. Não houve commit, mudança de branch, push, merge ou deploy automático.
2. Validar localmente e aplicar o SQL manual revisado em homologação. Conferir as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY sem publicar .env.local ou usar service_role.
3. Executar testes, lint e build; conferir build command (pnpm build com a versão fixada) e output directory dist na configuração existente da Vercel.
4. Depois da aprovação da equipe, registrar e enviar as alterações pelo fluxo Git adotado no projeto ou acionar a publicação pelo painel da Vercel. Não é necessário recriar o projeto hospedado.
5. Validar primeiro a prévia e depois a URL publicada: rotas profundas, login, permissões, carrinho, pedidos demonstrativos, modal, Serviços e cabeçalhos de indexação. Definir domínio oficial antes de publicar sitemap/canonical.

## Arquivos da etapa 6

Novos: Modal.jsx, PaymentSummary.jsx, DeliveryDetails.jsx, pagamentoDemonstrativo.js, src/seo/metadados.js, src/seo/RouteMetadata.jsx, public/robots.txt, tests/etapa6.test.mjs, este documento e supabase/revisao-etapa6/{01_dados_entrega_admin.sql,README.md}.

Alterados: ProductEditor.jsx, Admin.jsx, Carrinho.jsx, CampoQuantidade.jsx, MeusPedidos.jsx, PedidoConfirmado.jsx, OrderManager.jsx, pedidoService.js, Layout.jsx, Produto.jsx, Home.jsx, estrutura.css, pedidos.css, index.html, vercel.json e a configuração de HMR dos servidores de teste em tests/componentes.test.mjs. Alterações locais anteriores e .gitignore foram preservados; nenhuma dependência nova foi adicionada.

## Resultados observados nesta execução

- Nove testes automatizados passaram com node --test tests/*.test.mjs.
- ESLint e build de produção Vite passaram, executados diretamente pelos binários locais via Node.
- git diff --check passou.
- Checagem remota somente de leitura, sem sessão de usuário: usuario_admin, admin_resumo, admin_listar_produtos e admin_listar_pedidos recusaram acesso com HTTP 401 e código 42501. Não foram impressos dados pessoais nem executadas escritas. Esse resultado verifica apenas acesso anônimo, não substitui o teste com cliente autenticado e administrador.
- SQL adicional não aplicado. Nenhum checkout/cadastro/edição/status foi gravado remotamente nesta etapa; os relatos de sucesso da etapa 5 são do responsável.
- Modal, retorno de foco, teclas, mudanças rápidas de quantidade e responsividade permanecem com verificação manual em navegador real, além dos testes locais dos serviços e componentes.
