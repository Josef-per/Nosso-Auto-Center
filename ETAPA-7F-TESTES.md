# Etapa 7F — configuração e validação

## Supabase Auth: configuração manual obrigatória

O projeto usa `@supabase/supabase-js` **2.119.0**, cujo `UserAttributes` inclui `current_password`. O serviço envia `current_password` e `password` a `auth.updateUser()`, acrescentando `nonce` quando necessário. Não faz login auxiliar nem encerra a sessão.

Antes de disponibilizar a funcionalidade, no Dashboard do projeto, nas configurações do provedor Email de Authentication:

1. Ative **Require current password when changing password**. Essa exigência precisa existir no servidor; o campo obrigatório da interface não comprova a senha atual. Sem essa opção, não considere validada a proteção por senha atual.
2. Configure a política de senha com comprimento mínimo de **8 ou mais** caracteres, e os requisitos de complexidade e proteção contra senhas vazadas adequados ao projeto/plano. O frontend impõe o piso de 8; o Auth decide se a senha atende às demais regras.
3. Se usar **Secure password change / Require reauthentication when changing password**, mantenha essa opção ativa. Quando a sessão não for recente (24 horas), o Auth pode retornar `reauthentication_needed`; a aplicação chama `reauthenticate()`, apresenta um campo de código e envia esse código como `nonce` na nova tentativa. Confira entrega de e-mail/SMS, inclusive spam e limites do provedor.

Para ambiente local gerenciado por CLI, a opção correspondente à exigência da senha atual é `auth.email.require_current_password`. Este trabalho não altera configurações remotas, SQL, políticas, perfis, papéis ou credenciais.

Referências oficiais: [segurança de senhas](https://supabase.com/docs/guides/auth/password-security), [alteração com senha atual e versões suportadas](https://supabase.com/docs/guides/auth/passwords), [configuração CLI](https://supabase.com/docs/guides/local-development/cli/config).

## Testes reais com contas descartáveis

Não coloque senhas ou códigos reais em arquivos, screenshots, logs ou testes automatizados. Faça os procedimentos abaixo manualmente em ambiente de homologação, uma vez com cliente e outra com administrador:

1. Entre na conta, abra **Minha Conta → Segurança da conta** e confira os três campos ocultos, labels e botões Mostrar/Ocultar. Confira também Login e Cadastro, sem submeter cadastros desnecessários.
2. Tente senha curta e confirmação divergente: nenhum pedido de atualização deve sair. Tente senha atual errada com nova senha válida: o **backend** deve rejeitar. Se aceitar, interrompa a homologação e confira a configuração acima.
3. Tente uma senha com 8 caracteres que viole a política adicional escolhida: confira a mensagem de senha fraca. Teste offline e confira mensagem de conexão. Não provoque limites repetidamente em produção; para homologação de limites, use ambiente dedicado.
4. Com uma sessão com mais de 24 horas e mudança segura habilitada, solicite a alteração: confira recebimento do código. Teste código errado/expirado e reenvio respeitando os limites, depois código válido. Não basta usar uma sessão recém-criada para verificar esse fluxo.
5. Faça uma alteração válida. Confira limpeza imediata de todas as senhas e do código, confirmação e manutenção do acesso. Verifique Dados pessoais, Meus pedidos, carrinho e, para administrador, Administração e edição de produtos.
6. Em janela privativa separada, confirme que a senha anterior falha e que a nova permite login. A falha da senha anterior em novo login não implica encerramento das sessões existentes.
7. Confira os temas claro/escuro e larguras de 390px e desktop. Em Administração, teste Situação, filtro dos pedidos e categoria no modal de produto. No checkout teste UF, cálculo do frete e envio de formulário. Na Loja teste as três ordenações e combinação com os filtros.
8. Em cada select, teste mouse/toque, Tab, setas, Enter, Espaço, busca digitando e Escape. Confira foco visível e retorno ao gatilho, menu sem cortes junto às bordas, rolagem de listas longas e categoria acima do conteúdo do modal. Escape deve fechar primeiro o select, mantendo o modal aberto. Alterar categoria deve continuar marcando o formulário como alterado.
9. Confira sessão expirada e acesso anônimo: Minha Conta deve exigir login. Confirme com leitor de tela os nomes dos campos, estado dos botões de senha, opções selecionadas e anúncios de erro/sucesso.

## Cobertura local

`pnpm.cmd lint`, `pnpm.cmd build` e `pnpm.cmd test` verificam o projeto. Os testes novos usam somente dados fictícios e mocks de Auth, sem alterar contas reais. Cobrem validações, erros seguros, reautenticação, nonce, concorrência, limpeza, ausência de login/logout auxiliar, valor numérico inicial da categoria, integração FormData e abertura por teclado do select.

No navegador local foram conferidos Login/Cadastro (alternância acessível), ordenação da Loja com mouse e teclado, retorno de foco, temas claro/escuro e viewport mobile de 390px. Conta, Administração e checkout autenticados, entrega real de códigos e login com senha anterior/nova exigem a homologação manual acima.
