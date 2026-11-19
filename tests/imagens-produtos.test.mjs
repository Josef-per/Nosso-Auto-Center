import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { validarImagemProduto, LIMITE_IMAGEM_PRODUTO, urlImagemPermitida } from '../src/lib/imagemProduto.js';

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const arquivo = (bytes = png, type = 'image/png', name = 'imagem.png') => new File([Array.isArray(bytes) ? new Uint8Array(bytes) : bytes], name, { type });
const vite = () => createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });

test('imagem: formatos reais, limite exato de 2 MB e recusa de SVG/disfarces', async () => {
  assert.equal(await validarImagemProduto(arquivo()), 'png');
  assert.equal(await validarImagemProduto(arquivo([255,216,255,224], 'image/jpeg', 'imagem.jpeg')), 'jpg');
  assert.equal(await validarImagemProduto(arquivo(new TextEncoder().encode('RIFF1234WEBP'), 'image/webp')), 'webp');
  const limite = new Uint8Array(LIMITE_IMAGEM_PRODUTO); limite.set(png);
  assert.equal(await validarImagemProduto(arquivo(limite)), 'png');
  await assert.rejects(validarImagemProduto(arquivo(new Uint8Array(LIMITE_IMAGEM_PRODUTO + 1))), /2 MB/);
  await assert.rejects(validarImagemProduto(arquivo([], 'image/png')), /conteúdo/);
  await assert.rejects(validarImagemProduto(arquivo('<svg/>', 'image/svg+xml')), /SVG/);
  await assert.rejects(validarImagemProduto(arquivo('<svg/>', 'image/png')), /conteúdo/);
  await assert.rejects(validarImagemProduto(arquivo(png, 'image/jpeg')), /conteúdo/);
  assert.equal(urlImagemPermitida('https://example.com/foto.webp'), true);
  assert.equal(urlImagemPermitida('/images/produtos/foto.webp'), true);
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', '//example.com/foto.png', 'http://example.com/foto.png']) assert.equal(urlImagemPermitida(url), false);
});

test('Storage: admin obrigatório, caminhos únicos, MIME e falhas de envio', async (t) => {
  const server = await vite();
  try {
    const { supabase } = await server.ssrLoadModule('/src/lib/supabaseClient.js');
    const { enviarImagemProduto } = await server.ssrLoadModule('/src/services/imagemProdutoService.js');
    let admin = false, erro = null, rede = false, rpcErro = null;
    const uploads = [];
    t.mock.method(supabase, 'rpc', async (name) => { assert.equal(name, 'usuario_admin'); return { data: admin, error: rpcErro }; });
    t.mock.method(supabase.storage, 'from', (bucket) => {
      assert.equal(bucket, 'produtos');
      return {
        async upload(path, file, options) { uploads.push({ path, file, options }); if (rede) throw new Error('offline'); return { data: { path }, error: erro }; },
        getPublicUrl(path) { return { data: { publicUrl: `https://storage.example/produtos/${path}` } }; },
      };
    });
    await assert.rejects(enviarImagemProduto(arquivo()), /não autorizado/); assert.equal(uploads.length, 0);
    rpcErro = { code: 'PGRST301' };
    await assert.rejects(enviarImagemProduto(arquivo()), /não autorizado/); assert.equal(uploads.length, 0);
    rpcErro = null; admin = true;
    const a = await enviarImagemProduto(arquivo()); const b = await enviarImagemProduto(arquivo());
    assert.notEqual(a.caminho, b.caminho); assert.match(a.caminho, /^catalogo\/[0-9a-f-]{36}\.png$/);
    assert.equal(a.url, `https://storage.example/produtos/${a.caminho}`);
    assert.deepEqual(uploads[0].options, { contentType: 'image/png', cacheControl: '31536000', upsert: false });
    for (const [statusCode, msg] of [['403', /não foi autorizado/], ['404', /bucket/], ['413', /2 MB/], ['500', /configuração/]]) {
      erro = { statusCode }; await assert.rejects(enviarImagemProduto(arquivo()), msg);
    }
    erro = null; rede = true;
    await assert.rejects(enviarImagemProduto(arquivo()), /conexão/);
  } finally { await server.close(); }
});

test('editor: preview local, erro, retry sem novo upload, vínculo por RPC e opção de URL', async (t) => {
  const server = await vite();
  const { supabase } = await server.ssrLoadModule('/src/lib/supabaseClient.js');
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><div id="app"></div>', { url: 'http://localhost' });
  let decodificar = true;
  const originals = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true, createImageBitmap: async () => { if (!decodificar) throw new DOMException('corrompida', 'InvalidStateError'); return { close() {} }; } })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  const React = await import('react'); const { act } = React;
  const { createRoot } = await import('react-dom/client');
  let root;
  try {
    const { default: Editor } = await server.ssrLoadModule('/src/admin/ProductEditor.jsx');
    let falharSalvar = true, falharUpload = true, salvo = 0, uploads = 0; const payloads = [];
    t.mock.method(supabase, 'rpc', async (nome, args) => {
      if (nome === 'usuario_admin') return { data: true, error: null };
      assert.equal(nome, 'admin_salvar_produto'); payloads.push(args.p_produto);
      return { data: falharSalvar ? null : 1, error: falharSalvar ? { code: 'NETWORK' } : null };
    });
    t.mock.method(supabase.storage, 'from', () => ({
      async upload() { uploads++; return { data: {}, error: falharUpload ? { statusCode: '500' } : null }; },
      getPublicUrl(path) { return { data: { publicUrl: `https://storage.example/produtos/${path}` } }; },
      remove() { assert.fail('Não deve excluir imagens, inclusive em falha de RPC'); },
    }));
    root = createRoot(document.getElementById('app'));
    const props = { produto: { id: 1, nome: 'Peça', slug: 'peca', categoria_id: 1, preco: 10, estoque: 2, ativo: true, imagem_url: '/images/anterior.webp' }, categorias: [{ id: 1, nome: 'Freios' }], onSaved: () => salvo++, onCancel() {} };
    await act(async () => root.render(React.createElement(Editor, props)));
    assert.equal(document.querySelector('.admin-image-preview img').getAttribute('src'), '/images/anterior.webp');
    await act(async () => document.querySelector('input[value="arquivo"]').click());
    async function selecionar(file) {
      const input = document.getElementById('produto-arquivo');
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      await act(async () => { input.dispatchEvent(new dom.window.Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 10)); });
    }
    await selecionar(arquivo('<svg/>', 'image/png'));
    assert.match(document.body.textContent, /conteúdo/); assert.equal(uploads, 0);
    decodificar = false; await selecionar(arquivo());
    assert.match(document.body.textContent, /Não foi possível abrir/); assert.equal(uploads, 0);
    decodificar = true;
    await selecionar(arquivo());
    assert.match(document.querySelector('.admin-image-preview img').getAttribute('src'), /^blob:/);
    async function submit() { await act(async () => document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))); }
    await submit();
    assert.equal(payloads.length, 0); assert.equal(uploads, 1); assert.match(document.body.textContent, /Não foi possível enviar/);
    falharUpload = false; await submit();
    assert.equal(uploads, 2); assert.equal(salvo, 0); assert.match(document.body.textContent, /mesmo envio será reutilizado/);
    assert.match(payloads[0].imagem_url, /^https:\/\/storage.example\/produtos\/catalogo\//);
    assert.equal(props.produto.imagem_url, '/images/anterior.webp');
    falharSalvar = false; await submit(); assert.equal(uploads, 2); assert.equal(salvo, 1);
    await act(async () => document.querySelector('input[value="url"]').click());
    assert.equal(document.querySelector('.admin-image-preview img').getAttribute('src'), '/images/anterior.webp');
    await submit(); assert.equal(uploads, 2); assert.equal(payloads.at(-1).imagem_url, '/images/anterior.webp');
    await act(async () => document.querySelector('input[value="arquivo"]').click());
    await submit(); assert.match(document.body.textContent, /Selecione um arquivo/); assert.equal(uploads, 2);
  } finally {
    if (root) await act(async () => root.unmount());
    await supabase.auth.dispose();
    await server.close(); dom.window.close();
    for (const [key, desc] of originals) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; }
  }
});

test('migração: bucket limitado e guardas restritivas de escrita sem promover usuários', async () => {
  const sql = await readFile(new URL('../supabase/migrations/003_storage_produtos.sql', import.meta.url), 'utf8');
  assert.match(sql, /2097152/); assert.match(sql, /ARRAY\['image\/jpeg', 'image\/png', 'image\/webp'\]/);
  for (const command of ['INSERT', 'UPDATE', 'DELETE']) assert.match(sql, new RegExp(`AS RESTRICTIVE FOR ${command} TO public`));
  assert.match(sql, /FOR SELECT TO public/); assert.match(sql, /public.usuario_admin\(\)/);
  assert.doesNotMatch(sql, /UPDATE public\.perfis|UPDATE public\.produtos|service_role/i);
});
