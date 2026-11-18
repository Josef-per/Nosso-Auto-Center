import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { metadadosDaRota } from '../src/seo/metadados.js';

test('SEO: somente rotas públicas são indexáveis', () => {
  for (const path of ['/','/loja','/produto/1']) assert.equal(metadadosDaRota(path).indexavel, true);
  for (const path of ['/admin','/admin/produtos','/login','/cadastro','/checkout','/carrinho','/minha-conta','/pedido-confirmado/123','/inexistente','/produto/invalido']) assert.equal(metadadosDaRota(path).indexavel, false);
});

test('pagamentos e entrega: modalidades persistidas, pedidos antigos e ausência da migração', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  try {
    const { default: PaymentSummary } = await server.ssrLoadModule('/src/components/PaymentSummary.jsx');
    const { default: DeliveryDetails } = await server.ssrLoadModule('/src/admin/DeliveryDetails.jsx');
    for (const [method, texto] of [['pix','Nenhuma transferência realizada'],['boleto','Nenhuma cobrança ou documento bancário real gerado'],['cartao_credito','Nenhum dado real de cartão coletado ou pagamento processado']]) {
      const html = renderToStaticMarkup(React.createElement(PaymentSummary, { method, status: 'simulado' }));
      assert.ok(html.includes(texto)); assert.match(html, /Status financeiro/); assert.doesNotMatch(html, /Pagamento aprovado/);
    }
    assert.match(renderToStaticMarkup(React.createElement(PaymentSummary, {})), /Não registrada ou não reconhecida/);
    assert.match(renderToStaticMarkup(React.createElement(DeliveryDetails, {})), /indisponíveis nesta consulta/);
    const entrega = { comprador: 'Cliente de teste', telefone: 'Não informado', endereco: { logradouro: 'Rua de teste', numero: '20', cidade: 'Cidade', uf: 'SP', cep: '01001000' } };
    const html = renderToStaticMarkup(React.createElement(DeliveryDetails, { entrega }));
    assert.match(html, /Cliente de teste/); assert.match(html, /Rua de teste, 20/); assert.match(html, /01001000/);
    assert.match(renderToStaticMarkup(React.createElement(DeliveryDetails, { entrega: {} })), /Endereço não informado/);
  } finally { await server.close(); }
});

test('carrinho: persistência local e autenticada, estoque, concorrência e falha de gravação', async (t) => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  const antigo = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k) => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) } });
  try {
    const { supabase } = await server.ssrLoadModule('/src/lib/supabaseClient.js');
    const { alterarCarrinho, carregarCarrinho } = await server.ssrLoadModule('/src/services/carrinhoService.js');
    const { totalCarrinho } = await server.ssrLoadModule('/src/carrinho/resumoCarrinho.js');
    const produto = { id: 1, nome: 'Peça de teste', marca: 'Teste', preco: 10, estoque: 8, categorias: { nome: 'Freios' } };
    let linha = { id: 'item-1', produto_id: 1, quantidade: 2 };
    let falhar = false, concorrencia = false;
    t.mock.method(supabase, 'from', (tabela) => {
      let payload, acao = 'ler'; const filtros = [];
      const query = {
        select() { return this; }, eq(campo, valor) { filtros.push([campo,valor]); return this; },
        in() { return this; }, order() { return this; },
        update(valor) { payload = valor; acao = 'atualizar'; return this; },
        delete() { acao = 'remover'; return this; },
        then(resolve, reject) { return Promise.resolve({ data: tabela === 'produtos' ? [produto] : linha ? [linha] : [], error: null }).then(resolve, reject); },
        async maybeSingle() {
          assert.ok(filtros.some(([k,v]) => k === 'usuario_id' && v === 'usuario-teste'));
          assert.ok(filtros.some(([k,v]) => k === 'quantidade' && v === linha.quantidade));
          if (falhar) return { data: null, error: { code: 'NETWORK' } };
          if (concorrencia) return { data: null, error: null };
          const data = { ...linha, ...(payload ?? {}) };
          linha = acao === 'remover' ? null : data;
          return { data, error: null };
        },
      }; return query;
    });
    const chave = 'nosso-auto-center:carrinho';
    storage.set(chave, JSON.stringify([{ produtoId: '1', quantidade: 2 }]));
    const local = await alterarCarrinho(null, { acao: 'atualizar', id: '1', quantidade: 3, preco: 0.01 });
    assert.equal(totalCarrinho(local), 30); assert.equal(JSON.parse(storage.get(chave))[0].quantidade, 3);
    for (const quantidade of [0, 1.5, 9]) await assert.rejects(alterarCarrinho(null, { acao: 'atualizar', id: '1', quantidade }));
    assert.equal((await carregarCarrinho(null))[0].quantidade, 3);
    const auth = await alterarCarrinho('usuario-teste', { acao: 'atualizar', id: 'item-1', quantidade: 4 });
    assert.equal(auth[0].quantidade, 4); assert.equal(totalCarrinho(auth), 40);
    falhar = true;
    await assert.rejects(alterarCarrinho('usuario-teste', { acao: 'atualizar', id: 'item-1', quantidade: 5 }), /Não foi possível salvar/);
    assert.equal(linha.quantidade, 4);
    falhar = false; concorrencia = true;
    await assert.rejects(alterarCarrinho('usuario-teste', { acao: 'atualizar', id: 'item-1', quantidade: 5 }), /carrinho mudou/);
    concorrencia = false;
    assert.deepEqual(await alterarCarrinho('usuario-teste', { acao: 'remover', id: 'item-1' }), []);
    assert.deepEqual(await alterarCarrinho(null, { acao: 'remover', id: '1' }), []);
  } finally {
    if (antigo) Object.defineProperty(globalThis, 'localStorage', antigo); else delete globalThis.localStorage;
    await server.close();
  }
});
