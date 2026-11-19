# Etapa 7F.1 — recuperação de acesso

## Implementação

- `/esqueci-senha` é pública, com e-mail, bloqueio de envios simultâneos, feedback de conexão/limite e confirmação neutra. Usa `resetPasswordForEmail()` com `redirectTo` construído a partir de `window.location.origin` e caminho fixo `/redefinir-senha`. Não aceita destinos fornecidos em query strings.
- `/redefinir-senha` é pública e fica fora de `RotaVisitante`, evitando redirecionamento automático quando o link estabelece uma sessão. O formulário só aparece após `PASSWORD_RECOVERY` recebido pelo cliente Supabase. Uma sessão comum, `INITIAL_SESSION`, acesso direto ou `type=recovery` isolado não habilitam o formulário.
- A assinatura de Auth é instalada junto à criação do cliente, antes das páginas lazy e dos efeitos React. O controlador espera a recuperação de sessão do SDK e preserva o evento inicial até a página carregá-lo. Nenhum método Auth assíncrono é chamado de dentro do callback de `onAuthStateChange`.
- O cliente atual usa o fluxo **implicit padrão** de `supabase-js` 2.119.0, com detecção automática da sessão na URL. Não foi alterado o fluxo dos demais logins. A conclusão usa o evento do SDK, também emitido em recuperação PKCE quando esse fluxo e o verificador estão configurados. Não fazemos uma segunda troca manual do código.
- Antes de `updateUser({ password })`, `getUser()` valida a sessão no servidor e confere a identidade que iniciou a recuperação. Senha mínima de 8 caracteres e confirmação são verificadas; a política adicional é aplicada pelo Supabase. A recuperação não solicita `current_password`; a alteração em Minha Conta continua usando senha atual e nonce quando necessário.
- A autorização do formulário existe apenas em memória e é consumida após sucesso. **Recarregar a página depois de o SDK consumir o link exige solicitar outro link**; uma sessão persistida comum não é usada para recriar autorização de recuperação. Não criamos tokens ou indicadores persistidos próprios. O armazenamento de sessão já existente do SDK permanece sob controle do Supabase.
- Depois do SDK processar o retorno, query e fragmento são removidos do endereço e da entrada atual do histórico. Erros brutos, senhas, tokens e códigos não são registrados pela implementação.
- Após sucesso, os dois campos são limpos e a sessão usada na recuperação é encerrada com `signOut({ scope: 'local' })`. Não usamos `global` ou `others`. Se o encerramento falhar, a interface confirma que a senha mudou e oferece repetir somente o encerramento. O link de Login aparece depois da conclusão dessa etapa.
- Uma tentativa inválida de recuperação não encerra por conta própria uma sessão comum já existente. RLS, perfis e privilégios administrativos não são modificados.
- O alinhamento do `PasswordField` foi corrigido em CSS: a margem geral de `.profile-form button` não desloca mais o olhinho. O botão tem margem/padding zerados, alvo de 44px, centro vertical no input e reserva de 58px para o texto. Cada instância mantém sua própria visibilidade e preserva o `autocomplete`.

## Configuração manual do Supabase

**As URLs remotas permitidas não foram consultadas nem alteradas nesta implementação:** não há conexão de gerenciamento do Supabase disponível. Confira no projeto correto em **Authentication → URL Configuration**, antes da homologação. O domínio público de produção não está declarado nos arquivos de configuração consultados; substitua o exemplo abaixo pelo domínio real.

| Ambiente | URL a permitir em Redirect URLs |
| --- | --- |
| Localhost padrão do Vite | `http://localhost:5173/redefinir-senha` |
| IP local usado nesta verificação | `http://127.0.0.1:5173/redefinir-senha` |
| Produção | `https://SEU-DOMINIO/redefinir-senha` |

Use a origem e porta exatas com que abriu o site. Se o Vite escolher outra porta, cadastre a URL correspondente. Configure **Site URL** para a origem real de produção. Prefira entradas exatas em produção e cadastre explicitamente cada domínio autorizado, incluindo versões `www`/sem `www` se usadas.

O SMTP personalizado já configurado é reutilizado. Confira o template **Reset Password**: deve manter o link oficial `{{ .ConfirmationURL }}`, para o Supabase verificar o link e encaminhar à URL autorizada. Um link simples para `/redefinir-senha` não autentica a recuperação. Templates personalizados com `token_hash` que exigem um endpoint próprio de confirmação não são o formato usado nesta implementação.

Mantenha a política de senha do projeto com pelo menos 8 caracteres e os requisitos adicionais desejados. Não desative a exigência de senha atual da alteração em Minha Conta para fazer a recuperação funcionar; homologue o fluxo de recuperação real com a configuração existente.

O rewrite de SPA existente em `vercel.json` atende o acesso direto às duas rotas. Ambas recebem `noindex, nofollow`; no hosting Vercel, também foram declarados `Referrer-Policy: no-referrer` e `Cache-Control: no-store`. Estes headers só estarão ativos depois de uma publicação autorizada. Nenhum deploy foi realizado.

Referências oficiais: [resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [fluxos de senha e templates](https://supabase.com/docs/guides/auth/passwords), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Homologação real (manual, com contas de teste)

Não use credenciais de produção em testes automatizados e não registre o link recebido, os tokens ou as senhas. A implementação não enviou e-mails nem modificou senhas de contas reais.

1. Confira as URLs e o template acima. Abra o ambiente desejado e use **Login → Esqueceu sua senha?**. Solicite o link para uma conta de teste. Confira mensagem neutra, caixa de entrada e spam. Repita com um endereço inexistente: a resposta da página não deve informar a existência de conta.
2. Abra o link recebido. A URL final deve ser `/redefinir-senha`, sem redirecionamento para Minha Conta. Depois do processamento, não deve manter tokens na barra. O formulário deve apresentar somente Nova senha e Confirmar nova senha.
3. Teste senha com menos de 8 caracteres e confirmação divergente: nenhum `updateUser` deve ocorrer. Teste uma senha que viole a complexidade configurada: confira erro de política. A política do backend continua sendo a autoridade.
4. Confira cada olhinho isoladamente: revelar uma senha não revela a outra; o texto é preservado e o botão não envia o formulário. Valide teclado, foco, rótulos e estado pressionado. Repita no Login, Cadastro e nos três campos da Segurança da Conta.
5. Defina uma senha válida. Confira limpeza dos campos, confirmação, encerramento local e link para Login. Entre com a senha nova. Em tentativa separada, confirme que a antiga falha. Repita com uma conta cliente e uma administrativa; confirme acesso ao painel após novo login e ausência de alteração de papel.
6. Reabra o link já usado e teste um link expirado: não deve haver formulário autorizado. Acesse diretamente `/redefinir-senha`, anônimo e com sessão comum: deve solicitar novo link. Recarregue a página após o consumo do link: deve solicitar outro link, conforme a decisão de autorização em memória.
7. Teste falha de conexão ao solicitar e ao salvar, expiração da sessão durante o formulário e limite de envio em homologação. Se a senha mudar mas o logout falhar, use o botão de encerrar novamente; a aplicação não deve reenviar a nova senha.
8. Confira claro/escuro e mobile (390px), sem corte ou sobreposição dos botões. Verifique Dados pessoais, Meus pedidos, carrinho, Administração e alteração de senha atual em Minha Conta.

## Verificação local e arquivos

Foram executados lint, build e suíte automatizada. Os testes usam somente usuários fictícios/mocks, cobrindo captura antecipada de `PASSWORD_RECOVERY`, rejeição de sessão comum, expiração/troca de identidade, falha de conexão, mensagens neutras, limites, concorrência, confirmação/comprimento, isolamento dos olhinhos, atualização sem senha antiga, limpeza e logout com escopo local/retry.

No navegador, foram conferidos o link no Login, recuperação em claro/desktop e escuro/mobile, bloqueio de acesso direto e olhinho do Cadastro mobile. A medição no Login e Cadastro confirmou diferença vertical de **0px** entre o centro do input e o do botão. Os fluxos autenticados, entrega real do e-mail, expiração real do link e login com nova/antiga senha ainda exigem o roteiro manual acima.

Arquivos desta etapa:

- `src/auth/recuperacaoSenha.js`: controlador efêmero do fluxo.
- `src/lib/supabaseClient.js`: assinatura antecipada de Auth e limpeza do retorno.
- `src/services/contaService.js`: solicitar, redefinir e encerrar recuperação.
- `src/pages/EsqueciSenha.jsx`, `src/pages/RedefinirSenha.jsx`: novas páginas.
- `src/pages/Acesso.jsx`, `src/App.jsx`: link e rotas públicas.
- `src/css/redesign.css`: centralização e estilos das páginas.
- `src/seo/metadados.js`, `vercel.json`: títulos, indexação e headers.
- `tests/recuperacao-senha.test.mjs`: testes de regressão.
- Este documento: configuração, limitações e homologação.

As alterações locais da etapa 7F anterior foram preservadas. Sem SQL, novas dependências, alteração de contas, commit, push, merge ou deploy nesta etapa.
