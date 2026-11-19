import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { dataSaoPaulo, pontosSerie, rotuloDia } from '../src/admin/dashboardUtils.js';

test('gráfico: datas de São Paulo, zero e ponto único sem valores inválidos', () => {
  assert.match(dataSaoPaulo('2026-11-19T02:59:00Z'), /18\/11\/2026.*23:59/);
  assert.equal(rotuloDia('2026-11-19'), '19/11/2026');
  assert.equal(pontosSerie([{ dia: '2026-11-19', valor: 0 }]).pontos[0].x, 470);
  assert.equal(pontosSerie([{ dia: '2026-11-19', valor: 0 }]).pontos[0].y, 220);
});

test('admin: bloqueio cliente, métricas, navegação, RPC ausente e recarga após status', async (t) => {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><div id="app"></div>', { url: 'http://localhost/admin' });
  const originals = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, HTMLFormElement: dom.window.HTMLFormElement, HTMLSelectElement: dom.window.HTMLSelectElement,
    DocumentFragment: dom.window.DocumentFragment, Event: dom.window.Event, FormData: dom.window.FormData,
    Element: dom.window.Element, Node: dom.window.Node, NodeFilter: dom.window.NodeFilter,
    MutationObserver: dom.window.MutationObserver, CustomEvent: dom.window.CustomEvent,
    getComputedStyle: dom.window.getComputedStyle, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  const React = await import('react'); const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const { MemoryRouter, Routes, Route } = await import('react-router-dom');
  const root = createRoot(document.getElementById('app'));
  let supabase;
  try {
    ({ supabase } = await server.ssrLoadModule('/src/lib/supabaseClient.js'));
    const { default: Admin } = await server.ssrLoadModule('/src/pages/Admin.jsx');
    const { default: RotaAdmin } = await server.ssrLoadModule('/src/auth/RotaAdmin.jsx');
    const { SessaoContext } = await server.ssrLoadModule('/src/auth/useSessao.js');
    const service = await server.ssrLoadModule('/src/services/adminService.js');
    let admin = false, ausente = false, atualizacoes = 0;
    const calls = [];
    const pedido = { id: '00000000-0000-0000-0000-000000000001', criado_em: '2026-11-19T02:59:00Z', total: 100, status: 'pendente', status_pagamento: null, itens: [], entrega: null };
    const dashboard = () => ({ gerado_em: '2026-11-19T12:00:00Z', inicio: '2026-11-19', fim: '2026-11-19',
      resumo: { pedidos: 1, valor_pedidos: 100, ticket_medio: 100, pendentes: 1, cancelados: 0, produtos_ativos: 0, estoque_zerado: 0, estoque_baixo: 0, pagamento_nao_informado: 1 },
      serie: [{ dia: '2026-11-19', valor: 100, quantidade: 1 }], status: ['pendente','confirmado','enviado','entregue','cancelado'].map((status) => ({ status, quantidade: status === pedido.status ? 1 : 0 })), mais_vendidos: [], estoque: [] });
    t.mock.method(supabase, 'rpc', async (name, args) => {
      calls.push({ name, args });
      if (name === 'usuario_admin') return { data: admin, error: null };
      if (name === 'admin_listar_produtos') return { data: [], error: null };
      if (name === 'admin_listar_pedidos') return { data: [{ ...pedido }], error: null };
      if (name === 'admin_dashboard') return ausente ? { error: { code: 'PGRST202' } } : { data: dashboard(), error: null };
      if (name === 'admin_atualizar_status') { assert.deepEqual(args, { p_id: pedido.id, p_status: 'confirmado', p_status_atual: 'pendente' }); pedido.status = args.p_status; atualizacoes++; return { error: null }; }
      assert.fail(`RPC inesperada: ${name}`);
    });
    t.mock.method(supabase, 'from', (table) => { assert.equal(table, 'categorias'); return { select() { return this; }, async order() { return { data: [], error: null }; } }; });
    const render = async (key) => act(async () => {
      root.render(React.createElement(SessaoContext.Provider, { value: { user: { id: 'usuario-ficticio' } } },
        React.createElement(MemoryRouter, { key, initialEntries: ['/admin'] },
          React.createElement(Routes, null, React.createElement(Route, { element: React.createElement(RotaAdmin) },
            React.createElement(Route, { path: '/admin', element: React.createElement(Admin) }))))));
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    await render('cliente');
    assert.match(document.body.textContent, /Acesso restrito/);
    assert.equal(calls.filter((c) => c.name === 'admin_dashboard').length, 0);
    admin = true;
    await render('admin');
    assert.match(document.body.textContent, /Dados demonstrativos — pagamentos simulados/);
    assert.equal(document.querySelectorAll('.metric-card').length, 7);
    assert.match(document.querySelector('.dashboard-recent').textContent, /Não informado como simulado/);
    assert.equal(calls.find((c) => c.name === 'admin_dashboard').args.p_dias, 30);
    const selecionarPeriodo = async (label) => {
      await act(async () => document.getElementById('dashboard-periodo').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));
      await act(async () => {
        [...document.querySelectorAll('[role="option"]')].find((option) => option.textContent === label).click();
        await new Promise((resolve) => setTimeout(resolve, 5));
      });
    };
    await selecionarPeriodo('Últimos 7 dias');
    assert.equal(calls.filter((c) => c.name === 'admin_dashboard').at(-1).args.p_dias, 7);
    await selecionarPeriodo('Período completo');
    assert.equal(calls.filter((c) => c.name === 'admin_dashboard').at(-1).args.p_dias, null);
    await assert.rejects(service.carregarDashboardAdmin(9), /Período inválido/);
    const click = async (selector) => act(async () => { document.querySelector(selector).click(); await new Promise((resolve) => setTimeout(resolve, 5)); });
    await click('a[href="/admin#produtos"]');
    assert.equal(document.getElementById('produtos').hidden, false);
    assert.equal(document.getElementById('pedidos').hidden, true);
    await click('a[href="/admin#pedidos"]');
    assert.equal(document.getElementById('pedidos').hidden, false);
    const confirmar = [...document.querySelectorAll('#pedidos button')].find((button) => button.textContent === 'Confirmar atendimento');
    const consultas = calls.filter((c) => c.name === 'admin_listar_pedidos').length;
    await act(async () => confirmar.click());
    assert.equal(atualizacoes, 1);
    assert.ok(calls.filter((c) => c.name === 'admin_listar_pedidos').length > consultas);
    const metricCalls = calls.filter((c) => c.name === 'admin_dashboard').length;
    await click('a[href="/admin#visao-geral"]');
    assert.ok(calls.filter((c) => c.name === 'admin_dashboard').length > metricCalls);
    assert.match(document.querySelector('.dashboard-recent').textContent, /Confirmado/);
    ausente = true;
    await click('.admin-workspace-bar > button');
    assert.match(document.body.textContent, /migração do dashboard/);
    await click('a[href="/admin#produtos"]');
    assert.equal(document.getElementById('produtos').hidden, false); // CRUD permanece acessível sem RPC nova
  } finally {
    await act(async () => root.unmount());
    if (supabase) await supabase.auth.dispose();
    await server.close(); dom.window.close();
    for (const [key, desc] of originals) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; }
  }
});
