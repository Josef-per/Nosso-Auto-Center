import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cpfValido, mascararCpf, mascararCep } from '../src/lib/identificacao.js';
import { calcularFrete } from '../src/lib/frete.js';
import { validarEndereco } from '../src/lib/enderecoEntrega.js';
import { consultarCep } from '../src/services/cepService.js';

test('checkout: margem de 22px fica restrita ao botão de envio', async () => {
  const css = await readFile(new URL('../src/css/pedidos.css', import.meta.url), 'utf8');
  const redesign = await readFile(new URL('../src/css/redesign.css', import.meta.url), 'utf8');
  const selectField = await readFile(new URL('../src/components/SelectField.jsx', import.meta.url), 'utf8');

  assert.match(css, /\.checkout-form\s*>\s*fieldset\s*>\s*button\[type="submit"\]\s*\{\s*margin-top:\s*22px;/);
  assert.doesNotMatch(css, /\.checkout-form\s+button\s*\{\s*margin-top:\s*22px;/);
  assert.match(selectField, /className=\{`forminput select-trigger/);
  assert.match(redesign, /\.forminput\s*\{[^}]*min-height:\s*50px/);
});

test('CPF: valida os dois dígitos, rejeita repetição e corrupção', () => {
  assert.equal(cpfValido('529.982.247-25'), true);
  assert.equal(cpfValido('52998224724'), false);
  assert.equal(cpfValido('52998224735'), false);
  for (let n = 0; n < 10; n++) assert.equal(cpfValido(String(n).repeat(11)), false);
  assert.equal(cpfValido('123'), false);
  assert.equal(mascararCpf('52998224725'), '529.982.247-25');
  assert.equal(mascararCep('01001000'), '01001-000');
});
test('frete: fronteiras de SP, demais estados do Sudeste e outras regiões', () => {
  for (const cep of ['01000-000','19999999']) assert.equal(calcularFrete(cep), 15);
  for (const cep of ['20000000','28999999','29000000','29999999','30000000','39999999']) assert.equal(calcularFrete(cep), 25);
  for (const cep of ['40000000','69999999','90000000','99999999']) assert.equal(calcularFrete(cep), 39.9);
  for (const cep of ['', '00000000','1234567']) assert.equal(calcularFrete(cep), null);
  assert.equal(Math.round((89.9 + calcularFrete('01001000')) * 100), 10490);
});
function endereco(campos = {}) {
  return new Map(Object.entries({ cep: '01001-000', logradouro: 'Praça da Sé', numero: '10', cidade: 'São Paulo', uf: 'SP', ...campos }));
}
test('endereço: aceita correção manual e bloqueia campos obrigatórios inválidos', () => {
  assert.equal(validarEndereco(endereco()).endereco.cep, '01001000');
  assert.equal(validarEndereco(endereco({ logradouro: 'Correção manual', complemento: 'Sala 2' })).endereco.logradouro, 'Correção manual');
  for (const campo of ['cep','logradouro','numero','cidade','uf']) assert.equal(validarEndereco(endereco({ [campo]: '' })).campo, campo);
  assert.equal(validarEndereco(endereco({ uf: 'ZZ' })).campo, 'uf');
  assert.equal(validarEndereco(endereco({ numero: '1'.repeat(31) })).campo, 'numero');
});
test('ViaCEP: valida antes de consultar, preenche e trata inexistência, conexão e cancelamento', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' }); });
  await assert.rejects(consultarCep('123'), /8 dígitos/);
  assert.equal(calls, 0);
  assert.deepEqual(await consultarCep('01001-000'), { logradouro: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' });
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ erro: true }));
  await assert.rejects(consultarCep('99999999'), /não encontrado/);
  globalThis.fetch.mock.mockImplementation(async () => { throw new TypeError('offline'); });
  await assert.rejects(consultarCep('01001000'), /manualmente/);
  globalThis.fetch.mock.mockImplementation(async () => new Response('', { status: 500 }));
  await assert.rejects(consultarCep('01001000'), /Não foi possível/);
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ uf: 'ZZ' }));
  await assert.rejects(consultarCep('01001000'), /Não foi possível/);
  const controller = new AbortController(); controller.abort();
  globalThis.fetch.mock.mockImplementation(async (_url, options) => { options.signal.throwIfAborted(); });
  await assert.rejects(consultarCep('01001000', { signal: controller.signal }), { name: 'AbortError' });
});
