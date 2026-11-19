import { useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import PasswordField from '../components/PasswordField';
import PasswordStrength from '../components/PasswordStrength';
import { recuperacaoSenha } from '../lib/supabaseClient';
import { encerrarRecuperacaoSenha, redefinirSenha } from '../services/contaService';
import { mensagemErroSenha, validarNovaSenha } from '../lib/segurancaConta';

export default function RedefinirSenha() {
  const estado = useSyncExternalStore(recuperacaoSenha.subscribe, recuperacaoSenha.getSnapshot, recuperacaoSenha.getSnapshot);
  const [ocupado, setOcupado] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [sessaoEncerrada, setSessaoEncerrada] = useState(false);
  const [erro, setErro] = useState('');
  const [nova, setNova] = useState('');
  const envio = useRef(false);

  async function encerrar() {
    try {
      await encerrarRecuperacaoSenha(); setSessaoEncerrada(true);
    } catch {
      setErro('Sua senha foi alterada, mas não foi possível encerrar a sessão de recuperação. Tente encerrar novamente antes de voltar ao Login.');
    }
  }

  async function tentarEncerrar() {
    if (envio.current) return;
    envio.current = true; setOcupado(true); setErro('');
    try { await encerrar(); }
    finally { envio.current = false; setOcupado(false); }
  }

  async function enviar(event) {
    event.preventDefault();
    if (envio.current || estado.status !== 'valido' || sucesso) return;
    const form = event.currentTarget;
    const dados = new FormData(form);
    const nova = dados.get('nova');
    setErro('');
    const validacaoSenha = validarNovaSenha(nova);
    if (validacaoSenha) { setErro(validacaoSenha); return; }
    if (nova !== dados.get('confirmacao')) { setErro('A confirmação não corresponde à nova senha.'); return; }
    envio.current = true; setOcupado(true);
    try {
      await redefinirSenha(nova);
      form.reset();
      setNova('');
      // Também limpa imediatamente o DOM, inclusive em navegadores com campos controlados.
      if (form.elements.namedItem('nova')) form.elements.namedItem('nova').value = '';
      setSucesso(true);
      await encerrar();
    } catch (error) {
      setErro(mensagemErroSenha(error));
    } finally { envio.current = false; setOcupado(false); }
  }

  return <div className="container"><section className="panel auth-form recovery-page" aria-labelledby="titulo-redefinir">
    <p className="eyebrow">SEGURANÇA DA CONTA</p><h1 id="titulo-redefinir">Redefinir senha</h1>
    {sucesso ? <>
      <p className="profile-success" role="status">Senha redefinida com sucesso. Use a nova senha para entrar.</p>
      {sessaoEncerrada ? <Link className="pill primary" to="/login">Voltar ao Login</Link>
        : <button type="button" className="pill" disabled={ocupado} onClick={tentarEncerrar}>{ocupado ? 'Encerrando sessão…' : 'Encerrar sessão de recuperação'}</button>}
    </> : estado.status === 'verificando' ? <p role="status">Verificando link de recuperação…</p>
      : estado.status !== 'valido' ? <>
        <p className="notice" role="alert">Link de recuperação inválido, expirado ou já utilizado. Solicite um novo link para continuar.</p>
        <Link className="pill primary" to="/esqueci-senha">Solicitar novo link</Link>
        <Link className="account-link" to="/login">Voltar ao Login</Link>
      </> : <>
        <p id="redefinir-orientacoes" className="text-muted">Escolha uma senha exclusiva com pelo menos 8 caracteres. Frases-senha longas também funcionam. A avaliação é local e a política do Supabase Auth é verificada pelo servidor. Você não precisa da senha anterior.</p>
        <form onSubmit={enviar} aria-busy={ocupado}>
          <fieldset disabled={ocupado}>
            <label className="field" htmlFor="redefinir-nova">Nova senha</label>
            <PasswordField id="redefinir-nova" name="nova" autoComplete="new-password" minLength={8} value={nova} onChange={(event) => setNova(event.target.value)} required aria-describedby="redefinir-orientacoes senha-forca-redefinir" />
            <PasswordStrength password={nova} id="senha-forca-redefinir" />
            <label className="field" htmlFor="redefinir-confirmacao">Confirmar nova senha</label>
            <PasswordField id="redefinir-confirmacao" name="confirmacao" autoComplete="new-password" minLength={8} required />
            <button className="pill primary" type="submit">{ocupado ? 'Redefinindo…' : 'Redefinir senha'}</button>
          </fieldset>
        </form>
      </>}
    {erro && <p className="notice" role="alert">{erro}</p>}
  </section></div>;
}
