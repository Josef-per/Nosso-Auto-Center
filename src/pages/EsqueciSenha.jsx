import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitarRecuperacaoSenha } from '../services/contaService';

export const confirmacaoRecuperacao = 'Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.';

export default function EsqueciSenha() {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const envio = useRef(false);

  async function enviar(event) {
    event.preventDefault();
    if (envio.current) return;
    const form = event.currentTarget;
    const email = new FormData(form).get('email').trim();
    if (!email || !form.reportValidity()) return;
    envio.current = true; setEnviando(true); setErro('');
    try {
      await solicitarRecuperacaoSenha(email);
      form.reset(); setEnviado(true);
    } catch (error) {
      if (error.status === 429 || ['over_request_rate_limit', 'over_email_send_rate_limit'].includes(error.code)) {
        setErro('Aguarde alguns minutos antes de solicitar outro link de recuperação.');
      } else if (error instanceof TypeError || error.name === 'AuthRetryableFetchError') {
        setErro('Falha de conexão. Confira sua internet e tente novamente.');
      } else setErro('Não foi possível enviar as instruções. Tente novamente mais tarde.');
    } finally { envio.current = false; setEnviando(false); }
  }

  return <div className="container"><section className="panel auth-form recovery-page" aria-labelledby="titulo-recuperar">
    <p className="eyebrow">SEGURANÇA DA CONTA</p><h1 id="titulo-recuperar">Recuperar acesso</h1>
    <p className="text-muted">Informe o e-mail da sua conta para receber um link e escolher uma nova senha.</p>
    {enviado ? <p className="profile-success" role="status">{confirmacaoRecuperacao}</p> : <form onSubmit={enviar} aria-busy={enviando}>
      <fieldset disabled={enviando}>
        <label className="field" htmlFor="recuperar-email">E-mail</label>
        <input className="forminput" id="recuperar-email" name="email" type="email" autoComplete="email" required />
        <button className="pill primary" type="submit">{enviando ? 'Enviando…' : 'Enviar link de recuperação'}</button>
      </fieldset>
    </form>}
    {erro && <p className="notice" role="alert">{erro}</p>}
    <Link className="account-link" to="/login">Voltar ao Login</Link>
  </section></div>;
}
