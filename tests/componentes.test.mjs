import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { destinoAposAcesso } from '../src/auth/destinoAcesso.js';

test('retorno ao admin após login aceita somente destinos internos autorizados', () => {
  assert.equal(destinoAposAcesso('?continuar=/admin'), '/admin');
  assert.equal(destinoAposAcesso('?continuar=https://externo.example'), '/minha-conta');
  assert.equal(destinoAposAcesso('?continuar=//externo.example'), '/minha-conta');
});
test('componentes: três opções de pagamento, acessibilidade e total com frete', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  try {
    const { default: PaymentOptions } = await server.ssrLoadModule('/src/components/PaymentOptions.jsx');
    const { default: FormField } = await server.ssrLoadModule('/src/components/FormField.jsx');
    const { default: ResumoPedido } = await server.ssrLoadModule('/src/components/ResumoPedido.jsx');
    for (const value of ['pix','boleto','cartao_credito']) {
      const html = renderToStaticMarkup(React.createElement(PaymentOptions, { value, onChange() {} }));
      assert.equal((html.match(/type="radio"/g) ?? []).length, 3);
      assert.equal((html.match(/checked=""/g) ?? []).length, 1);
      assert.match(html, new RegExp('checked="" value="' + value + '"'));
      assert.doesNotMatch(html, /name="(?:cvv|cartao|numero_cartao)"/);
      assert.match(html, /sem processamento/);
    }
    const campo = renderToStaticMarkup(React.createElement(FormField, { id: 'cpf', label: 'CPF', error: 'Inválido', hint: 'Não verifica identidade.' }));
    assert.match(campo, /aria-invalid="true"/);
    assert.match(campo, /aria-describedby="cpf-erro cpf-ajuda"/);
    assert.match(campo, /role="alert"/);
    const resumo = renderToStaticMarkup(React.createElement(ResumoPedido, { itens: [], subtotal: 89.9, frete: 15, total: 104.9 }));
    assert.match(resumo, /Subtotal dos produtos/); assert.match(resumo, /Frete demonstrativo/); assert.match(resumo, /104,90/);
    const semCep = renderToStaticMarkup(React.createElement(ResumoPedido, { itens: [], subtotal: 89.9, frete: null, total: 89.9 }));
    assert.match(semCep, /Informe o CEP/);
  } finally { await server.close(); }
});
