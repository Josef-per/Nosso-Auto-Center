# Etapa 5 — revisão e aplicação manual

Nenhum destes scripts foi executado automaticamente. As migrações 001/002 foram preservadas.
A referência é o esquema e a RPC enviados pelo responsável, ainda sem inspeção direta do banco atual.

## Ordem de aplicação

1. Execute **00_inspecao.sql** (somente leitura). Guarde a definição da RPC e compare tipos, constraints, RLS e grants com a referência. Confirme que apenas o proprietário administra funções e que não existem grants de escrita por coluna adicionais. Se houver divergência, pare e adapte os scripts.
2. Revise e execute **01_checkout.sql**, inteiro em uma única transação. Acrescenta colunas anuláveis a pedidos; não inventa frete ou pagamento para pedidos antigos. Cria a nova assinatura finalizar_pedido(jsonb,text,text), que recalcula o frete e valida CPF no banco sem persistir esse dado. Revoga o acesso dos clientes à assinatura antiga para impedir checkout sem frete.
3. Revise e execute **02_administracao.sql**, inteiro. Instala as RPCs com verificação de perfis.papel em cada operação, sem escrita direta no catálogo ou pedidos. Mantém somente nome e telefone editáveis no próprio perfil. Acrescenta auditoria das mudanças de status.
4. Execute **03_verificacao.sql**, que apenas lê e verifica regras com asserções. Depois realize os testes autenticados descritos abaixo.

Os scripts 01 e 02 são de aplicação única: CREATE FUNCTION e guardas interrompem reaplicações. Em caso de erro, a transação inteira deve ser revertida; não execute trechos isolados. Não há promoção automática a administrador. Use somente uma conta administrativa já autorizada pelo responsável; nenhuma tela ou RPC pode conceder esse papel.

## Contrato da nova RPC

finalizar_pedido(p_endereco_entrega JSONB, p_metodo_pagamento TEXT, p_cpf TEXT) -> UUID

O endereço inclui cep sem máscara, logradouro, numero, bairro, complemento, cidade e uf. O método aceita pix, boleto e cartao_credito. O CPF segue somente como parâmetro transitório para validar dígitos verificadores e nunca é incluído no endereço ou pedido. Não há verificação de identidade nem cobrança. Não envie CPF em logs de aplicação; revise a retenção de parâmetros de requisição nos serviços operacionais.

O backend usa preços e estoque de produtos bloqueados em ordem de ID, serializa checkouts da mesma conta e remove apenas os itens consumidos. A transação reverte integralmente se estoque ou dados forem inválidos. Frete deriva exclusivamente do CEP: prefixos 01000–19999 custam 15; 20000–39999 custam 25; demais prefixos custam 39,90. Isso representa SP, demais estados do Sudeste e demais regiões. A função valida formato/faixa, sem consultar a existência postal; ViaCEP auxilia o preenchimento no navegador. UF e outros campos continuam corrigíveis manualmente e não alteram o frete.

subtotal_produtos + frete = total nos novos pedidos; status_pagamento permanece simulado. Pedidos antigos mantêm as quatro novas colunas NULL. O histórico continua acessível antes da migração; a confirmação tenta ler os campos novos e tolera somente erros de coluna ausente.

O front-end verifica checkout_etapa5_disponivel() e bloqueia a confirmação enquanto a nova configuração não está disponível. A aplicação da etapa 01 revoga a assinatura antiga: coordene com a disponibilização deste front-end, pois abas antigas precisarão ser recarregadas. Não restaure a permissão da RPC antiga para contornar erros da nova. As funções são SECURITY DEFINER com search_path vazio, nomes qualificados e grants explícitos. Revise o proprietário das funções e políticas que existam fora dos scripts de referência.

## Administração

/admin fica dentro da rota autenticada e verifica usuario_admin(). Toda RPC privilegiada repete a verificação no banco. A lista de produtos contém ativos e inativos; a exclusão é lógica. O editor grava nome, slug, categoria, marca, preço, preço anterior, estoque, descrição, selo, imagem e disponibilidade. O dashboard conta dados reais. Pedidos mostram até os 100 registros mais recentes e seus itens, sem expor CPF ou endereço dos clientes na listagem administrativa.

Transições autorizadas: pendente -> confirmado ou cancelado; confirmado -> enviado ou cancelado; enviado -> entregue. Entregue/cancelado são terminais. Confirmado refere-se ao atendimento, jamais à aprovação de pagamento. Atualizações verificam o status anterior e bloqueiam a linha para impedir alterações concorrentes. Cancelar devolve unidades ao estoque uma única vez; produto excluído fisicamente e sem referência não recebe reposição. A tabela pedido_status_auditoria registra o administrador e a mudança; não é exposta diretamente ao cliente.

Alterações simultâneas do catálogo seguem a última escrita autorizada; o editor não implementa versionamento otimista de estoque. Atualize a listagem antes de editar estoque durante a operação. Para catálogo muito maior que o escolar, a listagem de produtos deverá receber paginação; a listagem de pedidos já é limitada a 100.

## Testes após aplicação — ambiente de homologação

- Visitante: /admin redireciona ao login, RPCs recusam escrita. Cliente autenticado: /admin nega acesso e chamadas diretas às RPCs admin geram 42501. Tentativa de alterar perfis.papel é negada. Admin autorizado: criar, editar, desativar e reativar produto; conferir no catálogo após recarregar.
- Checkout com três pedidos separados: Pix, Boleto e Cartão. Conferir método, status simulado e total no banco. Tentar método inválido e CEP inválido diretamente na RPC; não deve haver pedido, baixa de estoque nem limpeza do carrinho.
- CEP 01001-000, CEP inexistente de oito dígitos, formato incompleto e falha de rede. Corrigir endereço manualmente; número e complemento não vêm da API. Alterar CEP durante consulta não pode aplicar resposta antiga.
- CPF válido matematicamente, dígito incorreto e sequências repetidas. Confirmar que não aparece em pedidos, endereço, auditoria ou armazenamento local do app.
- Comparar frete SP, RJ/ES/MG e outras regiões. Alterar o valor calculado no navegador não altera o total persistido. Enviar preços/frete extras no JSON não deve afetar a tarifa nem persistir extras.
- Estoque insuficiente e dois checkouts concorrentes da mesma conta: apenas um consome o carrinho. Cancelar pedido duas vezes: apenas a primeira mudança repõe estoque. Status terminal e status anterior desatualizado são recusados.
- Histórico e confirmação de pedidos anteriores permanecem legíveis, sem supor frete ou pagamento antigos.
- Desktop/mobile, teclado, foco, mensagens e ambos os temas, inclusive formulários e tabelas com rolagem interna.

## Validação local

node --test tests/*.test.mjs executa regras de CPF, máscara, CEP, frete, endereço, destinos de login e renderização dos componentes. Os testes da API usam respostas controladas para exercitar conexão, inexistência e cancelamento; não substituem uma consulta real.

Lint e build são executados com as dependências existentes. Testes de autorização, transações, SQL e fluxo completo dependem da revisão/aplicação manual e de sessões reais de cliente e administrador. Nenhum teste local é evidência de que as permissões remotas já foram aplicadas.

## Arquivos da etapa 5

- Controle e serviços: src/pages/Checkout.jsx, src/services/pedidoService.js, src/services/cepService.js, src/lib/enderecoEntrega.js, src/lib/identificacao.js, src/lib/frete.js.
- Componentes: src/checkout/CheckoutForm.jsx, src/components/FormField.jsx, src/components/PaymentOptions.jsx, src/components/ShippingEstimate.jsx, src/components/ResumoPedido.jsx e src/pages/PedidoConfirmado.jsx.
- Administração: src/pages/Admin.jsx, src/admin/ProductEditor.jsx, src/admin/OrderManager.jsx, src/services/adminService.js, src/auth/RotaAdmin.jsx; integração em src/App.jsx, src/auth/destinoAcesso.js e src/pages/MinhaConta.jsx.
- Apresentação: src/css/pedidos.css. Temas, Header/Footer e catálogo da etapa anterior foram preservados.
- Validação: tests/checkout.test.mjs, tests/componentes.test.mjs e script test em package.json. Dependências e pnpm-lock.yaml não foram alterados.
- Backend proposto: os quatro SQLs desta pasta. Os arquivos supabase/migrations/001_catalogo.sql e 002_perfis.sql não foram modificados.
