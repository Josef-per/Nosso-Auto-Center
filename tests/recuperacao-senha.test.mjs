import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { criarRecuperacaoSenha } from '../src/auth/recuperacaoSenha.js';

test('retorno capturado antes da página lazy sobrevive à sessão inicial do SDK', async () => {
  let notify, finalizar;
  const session = { user: { id: 'usuario-ficticio' } };
  const flow = criarRecuperacaoSenha({
    onAuthStateChange(callback) { notify = callback; return { data: { subscription: { unsubscribe() {} } } }; },
    getSession() { return new Promise((resolve) => { finalizar = resolve; }); },
    async getUser() { return { data: { user: session.user }, error: null }; },
  });
  notify('PASSWORD_RECOVERY', session);
  notify('INITIAL_SESSION', session);
  finalizar({ data: { session }, error: null });
  await flow.inicializacao;
  assert.equal(flow.getSnapshot().status, 'valido');
  await flow.conferir();
  flow.invalidar();
  await assert.rejects(flow.conferir(), /recuperacao_invalida/);
  flow.dispose();
});

test('recuperação exige evento do SDK, usuário válido e autorização ainda vigente', async () => {
  let notify, erro = null, id = 'usuario-ficticio';
  const auth = {
    onAuthStateChange(callback) { notify = callback; return { data: { subscription: { unsubscribe() {} } } }; },
    async getSession() { return { data: { session: { user: { id } } } }; },
    async getUser() { return { data: { user: { id } }, error: erro }; },
  };
  let limpezas = 0;
  const flow = criarRecuperacaoSenha(auth, () => limpezas++);
  await flow.inicializacao;
  assert.equal(flow.getSnapshot().status, 'invalido');
  await assert.rejects(flow.conferir(), /recuperacao_invalida/);
  notify('INITIAL_SESSION', { user: { id } });
  notify('SIGNED_IN', { user: { id } });
  await assert.rejects(flow.conferir(), /recuperacao_invalida/);
  notify('PASSWORD_RECOVERY', { user: { id } });
  assert.equal(flow.getSnapshot().status, 'valido');
  await flow.conferir();
  erro = { name: 'AuthRetryableFetchError' };
  await assert.rejects(flow.conferir());
  assert.equal(flow.getSnapshot().status, 'valido');
  erro = { status: 401 };
  await assert.rejects(flow.conferir());
  assert.equal(flow.getSnapshot().status, 'invalido');
  erro = null; notify('PASSWORD_RECOVERY', { user: { id } });
  id = 'outro-usuario';
  await assert.rejects(flow.conferir(), /recuperacao_invalida/);
  notify('PASSWORD_RECOVERY', { user: { id } });
  notify('SIGNED_OUT', null);
  await assert.rejects(flow.conferir(), /recuperacao_invalida/);
  assert.ok(limpezas >= 2);
  flow.dispose();
});

test('páginas: envio neutro, limites, link inválido, validação, limpeza e logout local', async (t) => {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><div id="app"></div>', { url: 'http://localhost:5173/redefinir-senha#error=access_denied' });
  const originals = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document,
    navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData,
    IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  const React = await import('react'); const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const { MemoryRouter } = await import('react-router-dom');
  const root = createRoot(document.getElementById('app'));
  let supabase, recuperacaoSenha;
  try {
    ({ supabase, recuperacaoSenha } = await server.ssrLoadModule('/src/lib/supabaseClient.js'));
    await recuperacaoSenha.inicializacao;
    assert.equal(window.location.hash, '');
    const { default: Forgot } = await server.ssrLoadModule('/src/pages/EsqueciSenha.jsx');
    const { default: Reset } = await server.ssrLoadModule('/src/pages/RedefinirSenha.jsx');
    let resetError = null, requests = 0, updates = 0, signouts = 0, release, updateError = null, logoutError = null;
    t.mock.method(supabase.auth, 'resetPasswordForEmail', async (_email, options) => {
      requests++;
      assert.equal(options.redirectTo, 'http://localhost:5173/redefinir-senha');
      if (release === null) await new Promise((resolve) => { release = resolve; });
      return { error: resetError };
    });
    t.mock.method(supabase.auth, 'getUser', async () => ({ data: { user: { id: 'usuario-ficticio' } }, error: null }));
    t.mock.method(supabase.auth, 'updateUser', async (args) => {
      updates++; assert.deepEqual(Object.keys(args), ['password']); return { error: updateError };
    });
    t.mock.method(supabase.auth, 'signOut', async (args) => {
      signouts++; assert.deepEqual(args, { scope: 'local' }); return { error: logoutError };
    });
    const render = async (Component, key) => act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(Component, { key }))));
    const submit = () => document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await render(Forgot, 'limites');
    document.getElementById('recuperar-email').value = 'ficticio@example.invalid';
    resetError = { status: 429 };
    await act(async () => submit()); assert.match(document.body.textContent, /Aguarde alguns minutos/);
    resetError = new TypeError();
    t.mock.method(supabase.auth, 'resetPasswordForEmail', async () => { throw resetError; });
    await act(async () => submit()); assert.match(document.body.textContent, /conexão/);
    t.mock.restoreAll();
    t.mock.method(supabase.auth, 'resetPasswordForEmail', async (_email, options) => {
      requests++; assert.equal(options.redirectTo, 'http://localhost:5173/redefinir-senha');
      await new Promise((resolve) => { release = resolve; }); return { error: { code: 'user_not_found' } };
    });
    const before = requests;
    await act(async () => { submit(); submit(); });
    assert.equal(requests, before + 1);
    await act(async () => release());
    assert.match(document.body.textContent, /Se este e-mail estiver cadastrado/);

    await render(Reset, 'invalid');
    assert.equal(document.querySelector('form'), null);
    assert.match(document.body.textContent, /inválido, expirado ou já utilizado/);
    const service = await server.ssrLoadModule('/src/services/contaService.js');
    await assert.rejects(service.redefinirSenha('Luar azul 7! Estrada'), /recuperacao_invalida/);
    t.mock.method(supabase.auth, 'getUser', async () => ({ data: { user: { id: 'usuario-ficticio' } }, error: null }));
    t.mock.method(supabase.auth, 'updateUser', async (args) => {
      updates++; assert.deepEqual(Object.keys(args), ['password']); return { error: updateError };
    });
    t.mock.method(supabase.auth, 'signOut', async (args) => {
      signouts++; assert.deepEqual(args, { scope: 'local' }); return { error: logoutError };
    });
    // Evento sintético exclusivamente no cliente mockado; nenhum token/conta real.
    await act(async () => supabase.auth._notifyAllSubscribers('PASSWORD_RECOVERY', { user: { id: 'usuario-ficticio' } }, false));
    assert.ok(document.querySelector('form'));
    assert.equal(document.querySelectorAll('.password-field').length, 2);
    const nova = document.getElementById('redefinir-nova');
    const confirmacao = document.getElementById('redefinir-confirmacao');
    const setValue = (input, value) => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    };
    setValue(nova, 'curta'); setValue(confirmacao, 'curta');
    await act(async () => submit()); assert.equal(updates, 0);
    setValue(nova, 'Luar azul 7! Estrada'); setValue(confirmacao, 'divergente');
    await act(async () => submit()); assert.equal(updates, 0);
    setValue(confirmacao, nova.value);
    await act(async () => document.querySelector('.password-toggle').click());
    assert.equal(nova.type, 'text'); assert.equal(confirmacao.type, 'password');
    updateError = { code: 'weak_password' };
    await act(async () => submit()); assert.match(document.body.textContent, /política/);
    updateError = null; logoutError = { status: 500 };
    await act(async () => submit());
    assert.equal(nova.value, ''); assert.equal(confirmacao.value, '');
    assert.match(document.body.textContent, /Senha redefinida com sucesso/);
    assert.match(document.body.textContent, /não foi possível encerrar/);
    assert.equal(document.querySelector('form'), null);
    assert.equal(signouts, 1);
    logoutError = null;
    await act(async () => document.querySelector('button').click());
    assert.equal(signouts, 2);
    assert.equal(document.querySelector('a').getAttribute('href'), '/login');
    await assert.rejects(service.redefinirSenha('outra fictícia'), /recuperacao_invalida/);
  } finally {
    await act(async () => root.unmount());
    recuperacaoSenha?.dispose();
    if (supabase) await supabase.auth.dispose();
    await server.close(); dom.window.close();
    for (const [key, desc] of originals) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; }
  }
});
