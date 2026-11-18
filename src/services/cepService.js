import { apenasDigitos } from '../lib/identificacao.js';
import { estados } from '../lib/enderecoEntrega.js';

export async function consultarCep(valor, { signal } = {}) {
  const cep = apenasDigitos(valor);
  if (!/^\d{8}$/.test(cep)) throw new Error('Informe um CEP com 8 dígitos.');
  let resposta;
  try {
    resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
    });
    if (!resposta.ok) throw new Error('Falha na consulta');
    const dados = await resposta.json();
    if (dados.erro) throw new Error('CEP não encontrado. Confira os dígitos informados.');
    if (!estados.includes(dados.uf) || !dados.localidade) throw new Error('Resposta de CEP incompleta.');
    return { logradouro: dados.logradouro || '', bairro: dados.bairro || '', cidade: dados.localidade, uf: dados.uf };
  } catch (erro) {
    if (signal?.aborted) throw erro;
    if (erro.message.startsWith('CEP não encontrado')) throw erro;
    throw new Error('Não foi possível consultar o CEP. Tente novamente ou preencha o endereço manualmente.', { cause: erro });
  }
}
