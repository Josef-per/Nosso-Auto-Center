# Dados de entrega administrativos — aplicação manual

A etapa 5 já foi aplicada pelo responsável. Não reaplique os SQLs antigos.

1. No SQL Editor, obtenha e guarde as três definições indicadas no começo de 01_dados_entrega_admin.sql.
2. Confirme que exigir_admin chama usuario_admin e que usuario_admin verifica auth.uid() e perfis.papel = 'admin', conforme a etapa 5. Confira que o proprietário dessas funções é um papel administrativo do banco, sem escrita de funções por anon/authenticated.
3. Revise e execute o arquivo 01_dados_entrega_admin.sql inteiro. Há uma transação e verificações de compatibilidade. Nenhum script é executado pela aplicação.
4. Recarregue /admin e expanda Dados de entrega em um pedido. Confirme nome, telefone e endereço com o banco. Pedidos antigos não são modificados e campos ausentes recebem mensagens no front-end.
5. Com sessão de cliente comum, faça uma chamada direta a admin_listar_pedidos: deve retornar erro 42501. Com sessão anônima, EXECUTE deve ser negado. Teste também a rota /admin; esconder a rota não substitui a verificação da RPC.

A RPC mantém nome, assinatura, tipo JSONB e os campos já consumidos. Acrescenta somente entrega.comprador, entrega.telefone e campos postais específicos de entrega.endereco. CPF, e-mail, senha, papel e outros campos de perfil não são expostos. Não usa auth.users, service_role no navegador, novos grants em tabelas ou novas políticas públicas.

Nome e telefone são os dados atuais do perfil; o endereço é o registro salvo no pedido. Não há snapshot histórico do nome/telefone. LEFT JOIN preserva pedidos mesmo sem perfil disponível. Nenhum dado é preenchido retroativamente. A listagem continua limitada aos 100 pedidos mais recentes.

Sem este SQL, a listagem existente continua funcionando e Dados de entrega informa indisponibilidade. Depois de aplicar, o botão Atualizar dados busca novamente a mesma RPC.

Para reversão, restaure a definição anterior da RPC que você guardou, preservando a chamada exigir_admin e os grants restritos. Não remova tabelas ou pedidos. Testes de segurança e retorno com JWTs reais continuam sob responsabilidade da homologação; este arquivo não foi executado automaticamente.
