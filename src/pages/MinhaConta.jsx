import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogOut, Package, UserRound } from 'lucide-react';
import AdminEntry from '../auth/AdminEntry';
import { useSessao } from '../auth/useSessao';
import MeusPedidos from '../components/MeusPedidos';
import { carregarPerfil, sair, salvarPerfil } from '../services/contaService';

function Perfil({ user }) {
  const [perfil, setPerfil] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [falhaLeitura, setFalhaLeitura] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    let ativo = true;
    carregarPerfil(user.id).then(
      (dados) => { if (ativo) setPerfil(dados); },
      () => { if (ativo) setFalhaLeitura(true); },
    );
    return () => { ativo = false; };
  }, [user.id, tentativa]);

  async function enviar(event) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    const nome = dados.get('nome').trim();
    const telefone = dados.get('telefone').trim() || null;
    setErro('');
    setSalvo(false);

    if (!nome) {
      setErro('Informe seu nome.');
      return;
    }

    setSalvando(true);
    try {
      const dadosSalvos = await salvarPerfil(user.id, { nome, telefone });
      setPerfil(dadosSalvos);
      setSalvo(true);
    } catch {
      setErro('Não foi possível salvar os dados. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (falhaLeitura) {
    return (
      <>
        <p className="notice" role="alert">Não foi possível carregar seu perfil.</p>
        <button
          className="pill"
          type="button"
          onClick={() => {
            setFalhaLeitura(false);
            setTentativa(tentativa + 1);
          }}
        >
          Tentar novamente
        </button>
      </>
    );
  }

  if (!perfil) return <p role="status">Carregando perfil…</p>;

  function editar(campo, valor) {
    setPerfil({ ...perfil, [campo]: valor });
    setSalvo(false);
    setErro('');
  }

  return (
    <form className="profile-form" onSubmit={enviar}>
      <fieldset disabled={salvando}>
        <label className="field" htmlFor="perfil-nome">Nome</label>
        <input
          id="perfil-nome"
          className="forminput"
          name="nome"
          autoComplete="name"
          value={perfil.nome ?? ''}
          onChange={(event) => editar('nome', event.target.value)}
          required
        />
        <label className="field" htmlFor="perfil-email">E-mail</label>
        <input id="perfil-email" className="forminput" type="email" value={user.email ?? ''} readOnly />
        <label className="field" htmlFor="perfil-telefone">Telefone (opcional)</label>
        <input
          id="perfil-telefone"
          className="forminput"
          name="telefone"
          type="tel"
          autoComplete="tel"
          value={perfil.telefone ?? ''}
          onChange={(event) => editar('telefone', event.target.value)}
        />
        {erro && <p className="notice" role="alert">{erro}</p>}
        {salvo && <p className="profile-success" role="status">Dados salvos com sucesso.</p>}
        <button className="pill primary" type="submit">{salvando ? 'Salvando…' : 'Salvar dados'}</button>
      </fieldset>
    </form>
  );
}

export default function MinhaConta() {
  const { user } = useSessao();
  const { hash } = useLocation();
  const pedidos = hash === '#meus-pedidos';
  const nome = user.user_metadata?.nome?.trim().split(' ')[0] || 'cliente';
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState('');

  async function encerrarSessao() {
    setErro('');
    setSaindo(true);
    try {
      await sair();
    } catch {
      setErro('Não foi possível sair da conta. Tente novamente.');
      setSaindo(false);
    }
  }

  return (
    <div className="container account-page">
      <div className="account-heading">
        <span className="account-avatar" aria-hidden="true">{nome[0].toLocaleUpperCase('pt-BR')}</span><div><p className="eyebrow">SEU ESPAÇO NO NOSSO AUTO CENTER</p><h1>Olá, {nome}.</h1><p>Seus dados e pedidos, sempre por perto.</p></div>
      </div>
      <div className="account-layout">
        <nav className="side-menu account-menu" aria-label="Minha conta">
          <Link to="/minha-conta#meus-dados" aria-current={!pedidos ? 'location' : undefined}><UserRound size={17} aria-hidden="true" />Dados pessoais</Link>
          <Link to="/minha-conta#meus-pedidos" aria-current={pedidos ? 'location' : undefined}><Package size={17} aria-hidden="true" />Meus pedidos</Link>
          <AdminEntry key={user.id} usuarioId={user.id} />
          <button type="button" onClick={encerrarSessao} disabled={saindo}>
            <LogOut size={18} aria-hidden="true" />
            {saindo ? 'Saindo…' : 'Sair da conta'}
          </button>
          {erro && <p className="notice" role="alert">{erro}</p>}
        </nav>
        <div className="account-content">
          <section id="meus-dados" tabIndex={-1} hidden={pedidos} className="panel" aria-labelledby="titulo-perfil">
            <p className="eyebrow">MINHA CONTA</p><h2 id="titulo-perfil">Dados pessoais</h2><p className="text-muted">Mantenha seu nome e telefone atualizados.</p>
            <Perfil key={user.id} user={user} />
          </section>
          <div hidden={!pedidos}><MeusPedidos key={user.id} usuarioId={user.id} /></div>
        </div>
      </div>
    </div>
  );
}
