import { useEffect, useRef, useState } from 'react';
import PasswordField from './PasswordField';
import PasswordStrength from './PasswordStrength';
import { alterarSenha, solicitarAlteracaoEmail, solicitarReautenticacao } from '../services/contaService';
import { mensagemErroSenha, validarAlteracaoSenha } from '../lib/segurancaConta';

export default function AccountSecurity({ emailAtual = '' }) {
  const [ocupado, setOcupado] = useState(false);
  const [codigoNecessario, setCodigoNecessario] = useState(false);
  const [codigoEmailNecessario, setCodigoEmailNecessario] = useState(false);
  const [nova, setNova] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [emailPendente, setEmailPendente] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const envio = useRef(false);
  const codigo = useRef(null);
  const codigoEmail = useRef(null);
  useEffect(() => {
    if (codigoNecessario && !ocupado) codigo.current?.focus();
  }, [codigoNecessario, ocupado]);

  async function enviarCodigo(referencia = codigo) {
    await solicitarReautenticacao();
    setMensagem('Código enviado para o e-mail ou telefone da sua conta. Confira também o spam.');
    referencia.current?.focus();
  }

  async function reenviar(referencia = codigo) {
    if (envio.current) return;
    envio.current = true; setOcupado(true); setErro(''); setMensagem('');
    try { await enviarCodigo(referencia); }
    catch (error) { setErro(mensagemErroSenha(error)); }
    finally { envio.current = false; setOcupado(false); }
  }

  async function enviar(event) {
    event.preventDefault();
    if (envio.current) return;
    const form = event.currentTarget;
    const dados = new FormData(form);
    setErro(''); setMensagem('');
    const validacao = validarAlteracaoSenha(dados.get('atual'), dados.get('nova'), dados.get('confirmacao'));
    if (validacao) { setErro(validacao); return; }
    envio.current = true; setOcupado(true);
    try {
      await alterarSenha(dados.get('atual'), dados.get('nova'), dados.get('nonce')?.trim());
      form.reset();
      setNova('');
      setCodigoNecessario(false);
      setMensagem('Senha alterada com sucesso. Seu acesso à conta foi preservado.');
    } catch (error) {
      if (error.code === 'reauthentication_needed') {
        setCodigoNecessario(true);
        try { await enviarCodigo(); }
        catch (falha) { setErro(mensagemErroSenha(falha)); }
      } else setErro(mensagemErroSenha(error));
    } finally {
      envio.current = false; setOcupado(false);
    }
  }

  async function enviarEmail(event) {
    event.preventDefault();
    if (envio.current) return;
    const email = novoEmail.trim();
    const dados = new FormData(event.currentTarget);
    setErro(''); setMensagem('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErro('Informe um endereço de e-mail válido.'); return; }
    if (email.toLocaleLowerCase('pt-BR') === emailAtual.toLocaleLowerCase('pt-BR')) { setErro('Informe um endereço diferente do e-mail atual.'); return; }
    envio.current = true; setOcupado(true);
    try {
      await solicitarAlteracaoEmail(email, dados.get('nonce')?.trim());
      setEmailPendente(email);
      setCodigoEmailNecessario(false);
      setMensagem('Solicitação enviada. Confirme a alteração pelos links enviados para o e-mail atual e o novo endereço. O e-mail atual continuará ativo até a confirmação.');
    } catch (error) {
      if (error.code === 'reauthentication_needed') {
        setCodigoEmailNecessario(true);
        try { await enviarCodigo(codigoEmail); }
        catch (falha) { setErro(mensagemErroSenha(falha)); }
      } else setErro(mensagemErroSenha(error));
    } finally { envio.current = false; setOcupado(false); }
  }

  return <div className="profile-form security-form">
    <form onSubmit={enviar} aria-busy={ocupado}>
    <p id="seguranca-orientacoes" className="text-muted">Use pelo menos 8 caracteres e escolha uma senha exclusiva. Frases-senha longas também são válidas. A força exibida é uma avaliação local; a política configurada no Supabase Auth é aplicada pelo servidor.</p>
    <fieldset disabled={ocupado}>
      <label className="field" htmlFor="senha-atual">Senha atual</label>
      <PasswordField id="senha-atual" name="atual" autoComplete="current-password" required />
      <label className="field" htmlFor="senha-nova">Nova senha</label>
      <PasswordField id="senha-nova" name="nova" autoComplete="new-password" minLength={8} value={nova} onChange={(event) => setNova(event.target.value)} aria-describedby="seguranca-orientacoes senha-forca" required />
      <PasswordStrength password={nova} id="senha-forca" />
      <label className="field" htmlFor="senha-confirmacao">Confirmar nova senha</label>
      <PasswordField id="senha-confirmacao" name="confirmacao" autoComplete="new-password" minLength={8} required />
      {codigoNecessario && <div className="reauthentication-fields">
        <label className="field" htmlFor="senha-nonce">Código de reautenticação</label>
        <input ref={codigo} className="forminput" id="senha-nonce" name="nonce" autoComplete="one-time-code" inputMode="numeric" aria-describedby="nonce-ajuda" required />
        <p id="nonce-ajuda" className="text-muted">Informe o código enviado para o e-mail ou telefone da sua conta.</p>
        <button type="button" className="pill" onClick={reenviar}>Enviar outro código</button>
      </div>}
      <button type="submit" className="pill primary">{ocupado ? 'Aguarde…' : 'Alterar senha'}</button>
    </fieldset>
    </form>
    {erro && <p className="notice" role="alert">{erro}</p>}
    {mensagem && <p className="profile-success" role="status">{mensagem}</p>}
    <div className="account-email-change">
      <h3>Alterar e-mail</h3>
      <p className="text-muted">E-mail atual: <strong>{emailAtual || 'Não informado'}</strong></p>
      <form onSubmit={enviarEmail} aria-busy={ocupado}>
        <fieldset disabled={ocupado}>
          <label className="field" htmlFor="novo-email">Novo e-mail</label>
          <input id="novo-email" className="forminput" name="email" type="email" autoComplete="email" value={novoEmail} onChange={(event) => setNovoEmail(event.target.value)} required />
          {codigoEmailNecessario && <div className="reauthentication-fields">
            <label className="field" htmlFor="email-nonce">Código de reautenticação</label>
            <input ref={codigoEmail} className="forminput" id="email-nonce" name="nonce" autoComplete="one-time-code" inputMode="numeric" required />
            <p className="text-muted">Informe o código enviado para a sua conta.</p>
            <button type="button" className="pill" onClick={() => reenviar(codigoEmail)}>Enviar outro código</button>
          </div>}
          <button type="submit" className="pill">{ocupado ? 'Aguarde…' : 'Solicitar alteração'}</button>
        </fieldset>
      </form>
      {emailPendente && <p className="text-muted" role="status">Confirmação pendente para <strong>{emailPendente}</strong>. Esse endereço ainda não está confirmado.</p>}
    </div>
  </div>;
}
