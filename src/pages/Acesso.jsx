import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { caminhoAcesso, destinoAposAcesso } from '../auth/destinoAcesso';
import { cadastrar, entrar } from '../services/contaService';

const mensagens = {
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  invalid_credentials: 'E-mail ou senha inválidos.',
  weak_password: 'Escolha uma senha mais forte e tente novamente.',
  email_address_invalid: 'Informe um e-mail válido.',
  over_email_send_rate_limit: 'Aguarde alguns minutos antes de solicitar outro e-mail.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
};

export default function Acesso({ cadastro = false }) {
  const { search } = useLocation();
  const destino = destinoAposAcesso(search);
  const login = caminhoAcesso('/login', destino);
  const [enviando, setEnviando] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');
  const [erro, setErro] = useState('');

  async function enviar(event) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    const email = dados.get('email').trim();
    const senha = dados.get('senha');
    const nome = dados.get('nome')?.trim();
    setErro('');

    if (cadastro && !nome) {
      setErro('Informe seu nome.');
      return;
    }

    setEnviando(true);
    try {
      if (cadastro) {
        const session = await cadastrar(nome, email, senha, destino);
        if (!session) setEmailEnviado(email);
      } else {
        await entrar(email, senha);
      }
    } catch (error) {
      const mensagem = cadastro ? 'criar a conta' : 'entrar';
      setErro(mensagens[error.code] ?? `Não foi possível ${mensagem}. Tente novamente.`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container">
      <div className="auth-shell">
        <div className="auth-art">
          <span className="eyebrow">Autopeças &amp; oficina</span>
          <p>Nosso Auto Center</p>
        </div>
        <section className="auth-form" aria-labelledby="titulo-acesso">
          <nav className="auth-switch" aria-label="Opções de acesso">
            <NavLink to={login}>Entrar</NavLink>
            <NavLink to={caminhoAcesso('/cadastro', destino)}>Cadastro</NavLink>
          </nav>
          <h1 id="titulo-acesso">{cadastro ? 'Crie sua conta' : 'Entre na sua conta'}</h1>
          {destino === '/checkout' && (
            <p className="text-muted">
              A compra usa o carrinho da sua conta. Os itens do carrinho de visitante ficam neste navegador.
            </p>
          )}
          {emailEnviado ? (
            <>
              <p className="text-muted" role="status">
                Verifique a caixa de entrada e o spam de <strong>{emailEnviado}</strong> para confirmar o cadastro.
              </p>
              <Link className="account-link" to={login}>Ir para o login</Link>
            </>
          ) : (
            <form onSubmit={enviar}>
              <fieldset disabled={enviando}>
                {cadastro && (
                  <>
                    <label className="field" htmlFor="acesso-nome">Nome</label>
                    <input id="acesso-nome" className="forminput" name="nome" autoComplete="name" required />
                  </>
                )}
                <label className="field" htmlFor="acesso-email">E-mail</label>
                <input id="acesso-email" className="forminput" name="email" type="email" autoComplete="email" required />
                <label className="field" htmlFor="acesso-senha">Senha</label>
                <input
                  id="acesso-senha"
                  className="forminput"
                  name="senha"
                  type="password"
                  autoComplete={cadastro ? 'new-password' : 'current-password'}
                  minLength={cadastro ? 6 : undefined}
                  aria-describedby={cadastro ? 'senha-requisitos' : undefined}
                  required
                />
                {cadastro && <small id="senha-requisitos" className="text-muted">Use pelo menos 6 caracteres.</small>}
                {erro && <p className="notice" role="alert">{erro}</p>}
                <button className="pill primary" type="submit">
                  {cadastro ? (enviando ? 'Criando conta…' : 'Criar conta') : (enviando ? 'Entrando…' : 'Entrar')}
                </button>
              </fieldset>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
