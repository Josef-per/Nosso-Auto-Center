# Etapa 7F.2 — segurança de senha e alteração de e-mail

## Diagnóstico da senha atual

O formulário já transmitia a senha atual e `contaService.alterarSenha()` a enviava como `current_password` junto de `password`. A versão instalada é `@supabase/supabase-js` 2.119.0; seu tipo `UserAttributes` declara `current_password`, disponível desde a versão 2.102.0. Portanto, o nome do atributo e o encaminhamento no cliente são compatíveis.

Esse atributo só exige a conferência quando o Supabase Auth está configurado para isso. Se `auth.email.require_current_password` estiver desativado no projeto remoto, o Auth pode aceitar a atualização sem validar a senha atual. Essa é a causa provável do comportamento relatado. Não temos evidência de acesso às configurações remotas nem foi feita uma alteração real com conta de homologação; por isso a causa não está confirmada e a correção de backend ainda precisa ser homologada.

No projeto hospedado, abra **Authentication → Sign In / Providers → Email** e ative **Require current password when changing password**. Em desenvolvimento local, configure:

```toml
[auth.email]
require_current_password = true
```

A aplicação não tenta validar a senha comparando valores no React, não faz login auxiliar e não modifica configurações Supabase. O serviço sempre envia a senha atual; a decisão de aceitar ou rejeitar pertence ao Supabase Auth. Com **Secure password change** habilitado, o SDK pode exigir reautenticação em sessões com mais de 24 horas; o fluxo existente envia o código como `nonce` e preserva esse comportamento. A recuperação autorizada por `PASSWORD_RECOVERY` continua atualizando somente `{ password }`, sem exigir a senha anterior.

## Política de senhas

Cadastro, troca de senha e redefinição por recuperação compartilham a validação local. Ela mantém o mínimo de 8 caracteres, recusa uma lista local de senhas comuns e sequências/repetições óbvias, exige pelo menos força **Razoável** segundo uma heurística local e apresenta os quatro níveis de força. Frases-senha longas podem atingir Razoável sem exigir símbolos ou mistura de maiúsculas.

A senha não é transmitida a um avaliador externo. A heurística do navegador é uma validação adicional, não zxcvbn e não uma garantia criptográfica. O servidor continua responsável pela autenticação, pelo mínimo de comprimento e pelas opções configuradas de complexidade e proteção contra senhas vazadas. Em **Authentication → Password**, mantenha o mínimo do servidor em 8 caracteres (ou mais, se a política do produto exigir) e configure os requisitos de complexidade/proteção contra vazamentos desejados. O Auth pode rejeitar uma senha que passe na heurística local; a interface mostra esse erro sem substituir a regra do servidor.

## Alteração de e-mail

A seção Segurança da conta exibe o e-mail atual e envia o novo com `supabase.auth.updateUser({ email })`. Com **Secure email change** ativo, a interface informa que a confirmação dos endereços atual e novo está pendente; o e-mail exibido como atual não muda no navegador. A atualização efetiva só deve ocorrer após o Supabase concluir as confirmações. Os erros de endereço inválido, endereço ocupado, limites, reautenticação, sessão e conexão são mapeados para mensagens ao cliente.

## Testes e homologação

Os testes automatizados exercitam as validações, os parâmetros de `updateUser`, erros simulados de senha atual incorreta, a proteção contra senhas previsíveis, o fluxo de recuperação autorizado e o pedido de e-mail. Esses testes usam mocks e **não demonstram** que o projeto Supabase remoto rejeita uma senha incorreta, nem que SMTP, troca com confirmação ou login com as senhas antiga/nova funcionam em produção.

Com uma conta descartável de cliente no ambiente de homologação:

1. Confirme no Dashboard que `Require current password when changing password` está ativo.
2. Entre e tente alterar a senha usando uma senha atual deliberadamente errada e uma senha nova aprovada. O Auth deve retornar erro, a interface deve dizer **“A senha atual está incorreta.”**, a senha antiga deve continuar permitindo login e a nova não deve funcionar.
3. Repita com a senha atual correta. Se for solicitada reautenticação, valide também código errado, código válido e reenvio. A nova senha deve permitir login e a antiga deve falhar em uma nova sessão privada.
4. Pelo link **Esqueceu sua senha?**, solicite recuperação, abra o link em um navegador privado e redefina sem informar a senha anterior. Confirme o login apenas com a nova senha.
5. Solicite a troca de e-mail por um endereço descartável. Confirme que o atual continua exibido e que o pedido permanece pendente até a confirmação exigida nos dois endereços; teste endereço inválido, já ocupado e limites em homologação.
6. Repita as verificações visuais em tema claro/escuro e viewport móvel (390 px) e desktop.

Não foram alteradas RLS, contas, perfis, papéis ou credenciais. Não houve commit, push, merge ou deploy.
