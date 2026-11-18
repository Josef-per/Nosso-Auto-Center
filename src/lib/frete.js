import { apenasDigitos } from './identificacao.js';

// Tabela acadêmica; manter alinhada a calcular_frete_demonstrativo no SQL.
export function calcularFrete(cep) {
  const digitos = apenasDigitos(cep);
  if (!/^\d{8}$/.test(digitos) || Number(digitos) < 1000000) return null;
  const prefixo = Number(digitos.slice(0, 5));
  if (prefixo <= 19999) return 15;
  if (prefixo <= 39999) return 25;
  return 39.9;
}
