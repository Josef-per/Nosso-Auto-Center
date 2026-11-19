const comuns = new Set([
  '12345678', '123456789', '1234567890', 'abcdefgh', 'abcdefg123', 'password',
  'password123', 'senha123', 'senha1234', 'qwerty123', 'admin123', 'iloveyou',
  '11111111', '00000000', '87654321', 'qwertyui',
]);

const sequencias = [
  '0123456789', '9876543210', 'abcdefghijklmnopqrstuvwxyz',
  'zyxwvutsrqponmlkjihgfedcba', 'qwertyuiop', 'poiuytrewq',
];

function previsivel(senha) {
  const normalizada = senha.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (comuns.has(normalizada) || /^(.)\1{5,}$/.test(normalizada) || /^(.{1,4})\1{2,}$/.test(normalizada)) return true;
  return sequencias.some((sequencia) => {
    for (let tamanho = 6; tamanho <= sequencia.length; tamanho++) {
      for (let inicio = 0; inicio <= sequencia.length - tamanho; inicio++) {
        if (normalizada.includes(sequencia.slice(inicio, inicio + tamanho))) return true;
      }
    }
    return false;
  });
}

/** Avaliação local, sem enviar a senha a terceiros. Não substitui a política do Auth. */
export function avaliarForcaSenha(senha = '') {
  if (typeof senha !== 'string' || senha.length < 8 || previsivel(senha)) {
    return { nivel: 0, rotulo: 'Muito fraca', previsivel: senha.length >= 8 && previsivel(senha) };
  }

  const palavras = senha.trim().split(/[\s_-]+/).filter(Boolean);
  const classes = [/[a-z]/.test(senha), /[A-Z]/.test(senha), /\d/.test(senha), /[^\p{L}\p{N}\s]/u.test(senha)].filter(Boolean).length;
  const unicos = new Set(senha.toLocaleLowerCase('pt-BR')).size;
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (senha.length >= 16) pontos++;
  if (classes >= 2) pontos++;
  if (classes >= 3 || unicos >= 10) pontos++;
  // Frases-senha longas ganham pontos sem exigir símbolos ou mistura de caixa.
  if (palavras.length >= 4 && senha.length >= 20 && unicos >= 10) pontos = Math.max(pontos, 4);
  const nivel = pontos >= 5 ? 3 : pontos >= 3 ? 2 : pontos >= 2 ? 1 : 0;
  return { nivel, rotulo: ['Muito fraca', 'Fraca', 'Razoável', 'Forte'][nivel], previsivel: false };
}

export function validarNovaSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 8) return 'Use pelo menos 8 caracteres na nova senha.';
  if (previsivel(senha)) return 'Essa senha é previsível. Escolha uma senha exclusiva ou uma frase-senha longa.';
  const { nivel } = avaliarForcaSenha(senha);
  if (nivel < 2) return 'A senha está muito fraca. Escolha uma frase-senha mais longa ou uma senha menos previsível.';
  return '';
}

export function validarAlteracaoSenha(atual, nova, confirmacao) {
  if (!atual) return 'Informe a senha atual.';
  const erroNova = validarNovaSenha(nova);
  if (erroNova) return erroNova;
  if (nova !== confirmacao) return 'A confirmação não corresponde à nova senha.';
  if (atual === nova) return 'Escolha uma senha diferente da atual.';
  return '';
}

export function mensagemErroSenha(error) {
  const mensagens = {
    invalid_credentials: 'A senha atual está incorreta.',
    current_password_invalid: 'A senha atual está incorreta.',
    incorrect_password: 'A senha atual está incorreta.',
    current_password_required: 'Informe a senha atual.',
    weak_password: 'A senha não atende à política de segurança configurada no servidor. Escolha uma senha mais forte.',
    same_password: 'Escolha uma senha diferente da atual.',
    reauthentication_not_valid: 'Código inválido ou expirado. Confira o código ou solicite outro.',
    reauthentication_needed: 'Confirme sua identidade com o código enviado antes de continuar.',
    session_not_found: 'Sua sessão expirou. Entre novamente para continuar.',
    session_expired: 'Sua sessão expirou. Entre novamente para continuar.',
    refresh_token_not_found: 'Sua sessão expirou. Entre novamente para continuar.',
    refresh_token_already_used: 'Sua sessão expirou. Entre novamente para continuar.',
    user_not_found: 'Sua sessão não está disponível. Entre novamente.',
    bad_jwt: 'Sua sessão expirou. Entre novamente para continuar.',
    over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    over_email_send_rate_limit: 'Aguarde alguns minutos antes de solicitar outro e-mail.',
    over_sms_send_rate_limit: 'Aguarde alguns minutos antes de solicitar outro código.',
    email_address_invalid: 'Informe um endereço de e-mail válido.',
    email_exists: 'Esse e-mail já está sendo usado por outra conta.',
    user_already_exists: 'Esse e-mail já está sendo usado por outra conta.',
    email_address_exists: 'Esse e-mail já está sendo usado por outra conta.',
  };
  if (error?.status === 429) return mensagens.over_request_rate_limit;
  if (error?.status === 401 || error?.name === 'AuthSessionMissingError') return mensagens.session_expired;
  if (error instanceof TypeError || error?.name === 'AuthRetryableFetchError') return 'Falha de conexão. Confira sua internet e tente novamente.';
  return mensagens[error?.code] ?? 'Não foi possível concluir a solicitação. Tente novamente.';
}
