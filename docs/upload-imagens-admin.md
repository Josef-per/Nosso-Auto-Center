# Upload administrativo de imagens — etapa 7E

Implementação local pronta. **A migração não foi aplicada no Supabase.** Nenhum produto, estoque, preço, usuário, pedido, bucket ou política remota foi alterado.

## Aplicação manual no Supabase

1. Confirmar que `supabase/revisao-etapa5/02_administracao.sql` já foi aplicada. A função existente `public.usuario_admin()` precisa reconhecer os administradores autorizados a partir de `perfis.papel`. Esta etapa não promove usuários e não substitui as RPCs administrativas.
2. No SQL Editor, inspecionar a configuração atual:

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE id = 'produtos';
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
```

3. Revisar e executar **inteira**, pelo responsável do banco, a migração `supabase/migrations/003_storage_produtos.sql`. O pré-requisito da etapa 5 fica em uma pasta de revisão antiga, então não aplicar esta migração cegamente em um banco novo que só tenha as migrações 001/002.
4. A migração cria o bucket `produtos` público para leitura, limita a 2.097.152 bytes e aceita apenas `image/jpeg`, `image/png` e `image/webp`. Se o bucket já existir como privado, a transação é interrompida para permitir a revisão dos arquivos antes de torná-los públicos. Em bucket público existente, os limites são ajustados; objetos existentes não são apagados.
5. Conferir as políticas `produtos_leitura_publica`, `produtos_envio_admin`, `produtos_edicao_admin`, `produtos_exclusao_admin` e as três `produtos_guard_*`. As guardas restritivas impedem que uma política permissiva antiga autorize clientes comuns a escrever neste bucket; as outras pastas/buckets não recebem autorização nova por elas. Políticas restritivas adicionais do próprio projeto ainda podem bloquear administradores e precisam ser revisadas pelo responsável.
6. Publicar o frontend pelo fluxo habitual quando autorizado. As variáveis continuam sendo `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`; não adicionar `service_role` ao frontend.

Referências oficiais: [acesso/RLS do Storage](https://supabase.com/docs/guides/storage/security/access-control), [configuração de buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets), [upload](https://supabase.com/docs/reference/javascript/storage-from-upload), [URL pública](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl).

## Fluxo de uso

No editor de produto, escolher **Usar URL** (HTTPS ou caminho local `/images/`) ou **Enviar do computador**. O seletor aceita JPG, PNG e WebP de até 2 MB. SVG, arquivos vazios e conteúdo incompatível com o MIME são recusados. Antes de aceitar a seleção, o navegador tenta decodificar a imagem; a prévia usa uma URL de objeto local, sem enviar o arquivo antecipadamente.

Ao salvar, a aplicação confere a permissão administrativa pela RPC existente, gera `catalogo/<UUID>.jpg|png|webp` e faz upload com `upsert: false`. O nome original não define o caminho no Storage. Após a confirmação do envio, `getPublicUrl()` fornece a URL que será enviada para a RPC **existente** `admin_salvar_produto`, no campo `imagem_url`. Usuários comuns são bloqueados pela rota, pela checagem do serviço e, após aplicação da migração, pelas políticas do Storage e pela RPC de salvamento.

O envio, a validação, as falhas e o sucesso têm mensagens próprias. O formulário e o fechamento do modal ficam bloqueados durante a gravação para evitar concorrência. A confirmação final reutiliza a mensagem existente “Produto salvo no catálogo”.

## Falhas e preservação das imagens

- Falha no upload: a RPC de salvamento não é chamada e a imagem anterior permanece vinculada.
- Upload concluído + falha na RPC: o editor mantém o upload concluído para reutilizá-lo na próxima tentativa com o mesmo arquivo. Não apaga a imagem anterior nem o novo arquivo, pois uma falha de rede pode deixar incerto se o servidor já confirmou o vínculo.
- Alterar o arquivo, voltar à URL ou fechar o editor após uma falha pode deixar um objeto não vinculado no Storage. A remoção deve ser manual, por administrador, **após conferir todos os vínculos**. Não há exclusão automática de imagens antigas/órfãs nesta etapa.
- A leitura do bucket é pública: usar apenas fotos de produtos autorizadas para publicação, sem documentos ou dados pessoais.
- O navegador valida MIME, assinatura, tamanho e decodificação; o bucket reforça MIME e tamanho. A assinatura não é uma análise antimalware e o Storage não faz a mesma decodificação do navegador. Os administradores continuam responsáveis pelos arquivos publicados.

## Testes realizados

- Validação final: `pnpm.cmd lint` e `pnpm.cmd build` aprovados; `pnpm.cmd test` com **17 testes aprovados, 0 falhas**. `jsdom` foi acrescentado somente como dependência de desenvolvimento para exercitar o formulário real em testes.
- Suíte automatizada: formatos, limite exato de 2 MB, excesso de tamanho, SVG e MIME adulterado; usuário não administrador e sessão negada; UUIDs distintos, `upsert: false`; erros 403/404/413/500 e falha de rede; prévia local; falha de gravação e retry sem segundo upload; preservação da imagem anterior; alternância para URL; ausência de arquivo válido. Serviços simulados, sem escrita no Supabase.
- Formulário real no navegador: seleção de WebP preparado, validação, prévia, estado de envio, salvamento, reabertura da edição e alteração por URL em uma instância local com Supabase inteiramente simulado.
- Editor em 360, 390, 768, 1024 e 1440px: sem overflow na página nem no modal. Revisão visual nos temas claro e escuro; console da prévia sem erros/avisos.
- Home, Loja, Produto, Carrinho com itens e Administração: os dois WebP carregaram nas telas reais, com `object-fit: contain`, usando dados simulados só na instância de conferência. O cliente real e seus dados dinâmicos não foram substituídos no código de produção.
- A validação SQL automatizada verifica a presença das políticas/guardas e os limites; **não executa nem comprova RLS no servidor remoto**.

## Conferência após aplicar a migração

Em ambiente de teste autorizado, com contas existentes:

| Perfil/caso | Resultado esperado |
| --- | --- |
| Visitante | Lê URL pública; upload, atualização e exclusão negados |
| Cliente autenticado | Upload direto e exclusão no Storage negados; `/admin` restrito |
| Administrador existente | Upload permitido; URL pública carrega; RPC vincula a imagem |
| JPG/PNG/WebP até 2 MB | Prévia e envio permitidos |
| SVG, MIME inválido ou arquivo maior que 2 MB | Bloqueio; também testar chamada direta ao Storage |
| Falha de rede/upload | Erro visível; produto anterior preservado |
| Falha no salvamento após upload | Erro visível; retry reutiliza arquivo; nenhuma exclusão |
| Troca de imagem de produto | Nova URL distinta e imagem anterior preservada |

Essa conferência remota fica pendente por depender da aplicação manual da migração. Não foram feitos commit, push, merge ou deploy.
