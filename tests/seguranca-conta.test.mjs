import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { avaliarForcaSenha, validarAlteracaoSenha, validarNovaSenha, mensagemErroSenha } from '../src/lib/segurancaConta.js';

test('senha: confirmação, comprimento, senha atual e erros seguros', () => {
  assert.match(validarAlteracaoSenha('', 'Luar azul 7! Estrada', 'Luar azul 7! Estrada'), /atual/);
  assert.match(validarAlteracaoSenha('anterior fictícia', 'curta', 'curta'), /8 caracteres/);
  assert.match(validarAlteracaoSenha('anterior fictícia', 'Luar azul 7! Estrada', 'diferente'), /confirmação/);
  assert.equal(validarAlteracaoSenha('anterior fictícia', 'Luar azul 7! Estrada', 'Luar azul 7! Estrada'), '');
  assert.equal(avaliarForcaSenha('12345678').rotulo, 'Muito fraca');
  assert.equal(avaliarForcaSenha('abcdefgh').rotulo, 'Muito fraca');
  assert.equal(avaliarForcaSenha('password123').rotulo, 'Muito fraca');
  assert.match(validarNovaSenha('11111111'), /previsível/);
  assert.equal(avaliarForcaSenha('Luar azul planeta tecido montanha').nivel >= 2, true);
  for (const code of ['invalid_credentials', 'current_password_invalid']) assert.match(mensagemErroSenha({ code }), /atual está incorreta/);
  assert.match(mensagemErroSenha({ code: 'weak_password' }), /política/);
  assert.match(mensagemErroSenha({ code: 'email_address_invalid' }), /e-mail válido/);
  assert.match(mensagemErroSenha({ code: 'email_exists' }), /já está sendo usado/);
  assert.match(mensagemErroSenha({ code: 'over_email_send_rate_limit' }), /Aguarde/);
  assert.match(mensagemErroSenha({ status: 429 }), /Muitas tentativas/);
  assert.match(mensagemErroSenha({ status: 401 }), /sessão expirou/);
  assert.match(mensagemErroSenha(new TypeError()), /conexão/);
  assert.doesNotMatch(mensagemErroSenha({ message: 'conteúdo sensível' }), /sensível/);
});

test('controles e segurança: toggle, validação, concorrência, nonce e limpeza sem trocar sessão', async (t) => {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><div id="app"></div>', { url: 'http://localhost' });
  const originals = new Map();
  const globals = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    Element: dom.window.Element, HTMLElement: dom.window.HTMLElement, HTMLFormElement: dom.window.HTMLFormElement,
    HTMLSelectElement: dom.window.HTMLSelectElement, Event: dom.window.Event, CustomEvent: dom.window.CustomEvent,
    DocumentFragment: dom.window.DocumentFragment, MutationObserver: dom.window.MutationObserver,
    Node: dom.window.Node, NodeFilter: dom.window.NodeFilter, getComputedStyle: dom.window.getComputedStyle,
    FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true };
  for (const [key, value] of Object.entries(globals)) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  const React = await import('react');
  const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('app'));
  let supabase;
  try {
    ({ supabase } = await server.ssrLoadModule('/src/lib/supabaseClient.js'));
    const { default: Security } = await server.ssrLoadModule('/src/components/AccountSecurity.jsx');
    let calls = 0, codes = 0, failure = null, release;
    t.mock.method(supabase.auth, 'signInWithPassword', () => assert.fail('Não substituir sessão'));
    t.mock.method(supabase.auth, 'signOut', () => assert.fail('Não encerrar sessão'));
    t.mock.method(supabase.auth, 'reauthenticate', async () => { codes++; return { error: null }; });
    t.mock.method(supabase.auth, 'updateUser', async (args, options) => {
      calls++;
      if (args.email) {
        assert.deepEqual(args, { email: 'cliente.novo@example.invalid' });
        assert.equal(options.emailRedirectTo, 'http://localhost/minha-conta#seguranca');
      } else assert.deepEqual(Object.keys(args).sort(), codes ? ['current_password', 'nonce', 'password'] : ['current_password', 'password']);
      if (release === null) await new Promise((resolve) => { release = resolve; });
      return { error: failure };
    });
    await act(async () => root.render(React.createElement(Security)));
    const setValue = (input, value) => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    };
    const fill = (nova = 'Luar azul 7! Estrada', confirmacao = nova) => {
      document.getElementById('senha-atual').value = 'anterior fictícia';
      setValue(document.getElementById('senha-nova'), nova);
      document.getElementById('senha-confirmacao').value = confirmacao;
    };
    const submit = () => document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    fill('curta'); await act(async () => submit()); assert.equal(calls, 0);
    fill('Luar azul 7! Estrada', 'divergente'); await act(async () => submit()); assert.equal(calls, 0);
    fill();
    const toggle = document.querySelector('.password-toggle');
    await act(async () => toggle.click());
    assert.equal(document.getElementById('senha-atual').type, 'text');
    assert.equal(document.getElementById('senha-atual').value, 'anterior fictícia');
    assert.equal(toggle.getAttribute('aria-label'), 'Ocultar senha');
    assert.equal(toggle.getAttribute('aria-pressed'), 'true');
    assert.equal(calls, 0);
    await act(async () => toggle.click());
    failure = { code: 'invalid_credentials' };
    await act(async () => submit()); assert.match(document.body.textContent, /atual está incorreta/);
    failure = { code: 'reauthentication_needed' };
    await act(async () => submit()); assert.equal(codes, 1);
    document.getElementById('senha-nonce').value = 'código fictício';
    failure = { code: 'reauthentication_not_valid' };
    await act(async () => submit()); assert.match(document.body.textContent, /inválido ou expirado/);
    failure = null; release = null;
    const before = calls;
    await act(async () => { submit(); submit(); });
    assert.equal(calls, before + 1); assert.equal(document.querySelector('fieldset').disabled, true);
    await act(async () => release());
    for (const input of document.querySelectorAll('.password-field input')) assert.equal(input.value, '');
    assert.equal(document.getElementById('senha-nonce'), null);
    assert.match(document.body.textContent, /Senha alterada com sucesso/);
    const emailForm = document.querySelectorAll('form')[1];
    setValue(document.getElementById('novo-email'), 'cliente.novo@example.invalid');
    await act(async () => emailForm.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
    assert.match(document.body.textContent, /Confirmação pendente/);
    assert.match(document.body.textContent, /O e-mail atual continuará ativo até a confirmação/);

    const { default: SelectField } = await server.ssrLoadModule('/src/components/SelectField.jsx');
    await act(async () => root.render(React.createElement('form', null,
      React.createElement('label', { htmlFor: 'categoria' }, 'Categoria'),
      React.createElement(SelectField, { id: 'categoria', name: 'categoria_id', defaultValue: 1, required: true },
        React.createElement('option', { value: '' }, 'Selecione'),
        React.createElement('option', { value: 1 }, 'Freios'),
        React.createElement('option', { value: 2 }, 'Motor')))));
    assert.equal(new FormData(document.querySelector('form')).get('categoria_id'), '1');
    const trigger = document.getElementById('categoria');
    assert.equal(trigger.getAttribute('role'), 'combobox');
    await act(async () => trigger.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(document.querySelectorAll('[role="option"]').length, 2);
    await act(async () => document.querySelectorAll('[role="option"]')[1].click());
    assert.equal(new FormData(document.querySelector('form')).get('categoria_id'), '2');
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  } finally {
    await act(async () => root.unmount());
    if (supabase) await supabase.auth.dispose();
    await server.close(); dom.window.close();
    for (const [key, desc] of originals) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; }
  }
});
