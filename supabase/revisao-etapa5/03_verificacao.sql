-- Executar manualmente após 01 e 02, como proprietário no SQL Editor.
-- Somente leituras e asserções. Não substitui testes com JWTs reais.
BEGIN;
DO $$
BEGIN
  ASSERT public.calcular_frete_demonstrativo('01001000') = 15;
  ASSERT public.calcular_frete_demonstrativo('19999999') = 15;
  ASSERT public.calcular_frete_demonstrativo('20000000') = 25;
  ASSERT public.calcular_frete_demonstrativo('29000000') = 25;
  ASSERT public.calcular_frete_demonstrativo('39999999') = 25;
  ASSERT public.calcular_frete_demonstrativo('40000000') = 39.90;
  ASSERT public.calcular_frete_demonstrativo('90000000') = 39.90;
  ASSERT public.cpf_digitos_validos('52998224725');
  ASSERT NOT public.cpf_digitos_validos('52998224724');
  ASSERT NOT public.cpf_digitos_validos('11111111111');
  ASSERT NOT has_function_privilege('anon','public.finalizar_pedido(jsonb,text,text)','EXECUTE');
  ASSERT NOT has_function_privilege('authenticated','public.finalizar_pedido(jsonb)','EXECUTE');
  ASSERT has_function_privilege('authenticated','public.finalizar_pedido(jsonb,text,text)','EXECUTE');
  ASSERT NOT has_function_privilege('anon','public.admin_salvar_produto(jsonb)','EXECUTE');
  ASSERT NOT has_function_privilege('authenticated','public.exigir_admin()','EXECUTE');
  ASSERT NOT has_column_privilege('authenticated','public.perfis','papel','UPDATE');
  ASSERT NOT has_table_privilege('authenticated','public.produtos','INSERT');
  ASSERT NOT has_table_privilege('authenticated','public.produtos','UPDATE');
  ASSERT NOT has_table_privilege('authenticated','public.pedidos','UPDATE');
  BEGIN
    PERFORM public.calcular_frete_demonstrativo('123');
    RAISE EXCEPTION 'CEP curto foi aceito';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
END $$;
SELECT id,total,subtotal_produtos,frete,metodo_pagamento,status_pagamento
FROM public.pedidos WHERE metodo_pagamento IS NOT NULL AND
  (total IS DISTINCT FROM subtotal_produtos + frete OR status_pagamento IS DISTINCT FROM 'simulado');
-- Esperado: zero linhas.
ROLLBACK;
