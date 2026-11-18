export const apenasDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');
export function mascararCep(valor) {
  return apenasDigitos(valor).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}
export function mascararCpf(valor) {
  return apenasDigitos(valor).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
export function cpfValido(valor) {
  const cpf = apenasDigitos(valor);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(cpf[tamanho])) return false;
  }
  return true;
}
