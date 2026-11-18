export const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export function validarEndereco(dados) {
  const ler = (campo) => String(dados.get(campo) ?? '').trim();
  const cep = ler('cep');
  if (!/^\d{5}-?\d{3}$/.test(cep)) {
    return { campo: 'cep', erro: 'Informe um CEP com 8 dígitos.' };
  }

  const endereco = {
    cep: cep.replace('-', ''),
    logradouro: ler('logradouro'),
    numero: ler('numero'),
    cidade: ler('cidade'),
    uf: ler('uf'),
    bairro: ler('bairro'),
    complemento: ler('complemento'),
  };

  if (!endereco.logradouro) return { campo: 'logradouro', erro: 'Informe o logradouro.' };
  if (!endereco.numero) return { campo: 'numero', erro: 'Informe o número do endereço.' };
  if (!endereco.cidade) return { campo: 'cidade', erro: 'Informe a cidade.' };
  if (!estados.includes(endereco.uf)) return { campo: 'uf', erro: 'Selecione uma UF válida.' };
  return { endereco };
}
