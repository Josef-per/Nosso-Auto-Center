# Avaliações de produtos — aplicação manual

O arquivo `01_avaliacoes.sql` não foi executado. A página de produto funciona sem ele e informa que as avaliações estão indisponíveis. Não interpretar esse estado como ausência de avaliações.

## Aplicar

1. Faça backup e valide em um projeto de teste com o catálogo e Supabase Auth existentes.
2. Revise e execute manualmente `01_avaliacoes.sql` no SQL Editor com o proprietário do banco. O script usa uma transação e falha se a tabela já existir (evita reaplicar sobre uma estrutura diferente).
3. Recarregue a página de produto. Sem registros, deve aparecer “Ainda sem avaliações”.
4. Execute a matriz abaixo usando duas sessões autenticadas de teste e uma sessão visitante. Não use contas reais de clientes para testes.

## Matriz de segurança e integração a validar manualmente

- Visitante: consultar resumo/comentários pela RPC; tentar SELECT direto e INSERT/UPDATE/DELETE na tabela — devem ser negados.
- Cliente A: inserir nota 1 e 5, comentário vazio e comentário de 1.000 caracteres; consultar/editar/remover sua avaliação.
- Nota 0, 6, fracionária ou nula e comentário de 1.001 caracteres: banco deve rejeitar (a nota fracionária enviada por REST deve ser rejeitada como representação inválida de smallint).
- Segunda avaliação de A no mesmo produto: violação de unicidade; outro produto: permitida.
- Cliente B: não pode ler diretamente, atualizar ou remover a avaliação de A, mesmo conhecendo seu UUID. Pode publicar sua própria avaliação.
- INSERT com `usuario_id`, `id` ou datas; UPDATE de `usuario_id`, `produto_id`, `id` ou datas: permissão negada por coluna, além do trigger para identificadores imutáveis.
- Produto inexistente: FK rejeita. Produto inativo: RLS rejeita publicação/edição e RPC pública não apresenta avaliações; o proprietário ainda pode remover a sua.
- Média e quantidade devem refletir todos os registros, inclusive quando há mais de 8 avaliações; navegação só pagina comentários.
- Resposta pública: apenas UUID da avaliação, nota, comentário e datas. Sem e-mail, nome, UUID de usuário, telefone ou join com perfil. Autor público recebe o rótulo neutro “Cliente”, sem selo de compra verificada.
- Falha de rede/RPC ausente: produto e carrinho continuam utilizáveis; publicação não informa sucesso indevido.

O comentário é conteúdo público fornecido pelo próprio usuário, com orientação para não incluir dados pessoais. É renderizado como texto React (sem HTML). Não há aprovação/moderação ou verificação de compra nesta etapa. Não foram criadas avaliações fictícias.

## Estrutura e permissões

`usuario_id DEFAULT auth.uid()`, FK para Auth, unicidade composta, checks e RLS. INSERT permite só produto/nota/comentário; UPDATE só nota/comentário. Leitura direta restrita ao proprietário. RPC pública com projeção fixa, SQL estático, `search_path` vazio e paginação limitada; nenhuma consulta a dados pessoais. Exclusão da conta/produto remove avaliações relacionadas.

Documentação usada na revisão: [RLS do Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) e [privilégios por coluna do PostgreSQL](https://www.postgresql.org/docs/current/sql-grant.html). A segurança efetiva ainda precisa da execução da matriz em um banco de teste: revisão de código e mocks não substituem isso.

Para desativar a interface, revogue a execução da RPC e as permissões de escrita; preserve os registros até decidir sua retenção. Não faça rollback removendo a tabela sem backup. Nenhuma migração altera checkout, estoque, pedidos, autenticação ou RPCs administrativas existentes.
