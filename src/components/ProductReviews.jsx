import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Star } from 'lucide-react';
import { useSessao } from '../auth/useSessao';
import { limiteComentario } from '../lib/avaliacoes';
import { caminhoAcesso } from '../auth/destinoAcesso';
import { buscarMinhaAvaliacao, consultarAvaliacoes, removerAvaliacao, salvarAvaliacao } from '../services/avaliacaoService';

function Estrelas({ nota }) {
  return <span className="review-stars" aria-label={`${Number(nota).toLocaleString('pt-BR')} de 5 estrelas`}>{[1, 2, 3, 4, 5].map((n) => <span className="review-star" key={n}><Star size={15} aria-hidden="true" /><span style={{ width: `${Math.max(0, Math.min(1, nota - n + 1)) * 100}%` }}><Star size={15} fill="currentColor" aria-hidden="true" /></span></span>)}</span>;
}

function ReviewForm({ minha, produtoId, usuarioId, onChanged }) {
  const [nota, setNota] = useState(minha?.nota || 0);
  const [comentario, setComentario] = useState(minha?.comentario || '');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  async function executar(remover = false) {
    if (ocupado) return;
    setOcupado(true); setErro('');
    try {
      if (remover) await removerAvaliacao(produtoId, usuarioId);
      else await salvarAvaliacao(produtoId, usuarioId, nota, comentario, Boolean(minha));
      onChanged(remover ? 'Avaliação removida.' : 'Avaliação salva. Obrigado por compartilhar sua experiência.');
    } catch (error) { setErro(error.message); setOcupado(false); }
  }
  return <form className="review-form" onSubmit={(event) => { event.preventDefault(); executar(); }}>
    <h3>{minha ? 'Sua avaliação' : 'Como foi sua experiência com a peça?'}</h3>
    <p className="text-muted">Compartilhe sua opinião sobre este produto. Não inclua e-mail, telefone ou dados pessoais.</p>
    <fieldset className="rating-picker" disabled={ocupado}><legend>Sua nota</legend>{[1, 2, 3, 4, 5].map((n) => <label key={n} className={nota >= n ? 'filled' : ''}><input type="radio" name="nota" value={n} checked={nota === n} onChange={() => setNota(n)} required aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`} /><Star size={24} fill={nota >= n ? 'currentColor' : 'none'} aria-hidden="true" /></label>)}</fieldset>
    <label className="field" htmlFor="avaliacao-comentario">Comentário (opcional)</label><textarea id="avaliacao-comentario" className="forminput" rows={4} maxLength={limiteComentario} value={comentario} disabled={ocupado} onChange={(e) => setComentario(e.target.value)} aria-describedby="avaliacao-limite" placeholder="O que você gostaria de compartilhar?" />
    <small className="text-muted" id="avaliacao-limite">{[...comentario].length} / 1.000 caracteres</small>
    {erro && <p className="notice" role="alert">{erro}</p>}
    <div className="checkout-actions"><button className="pill primary" type="submit" disabled={ocupado}>{ocupado ? 'Salvando…' : minha ? 'Salvar alterações' : 'Publicar avaliação'}</button>{minha && <button className="pill" type="button" disabled={ocupado} onClick={() => setConfirmar(true)}>Remover avaliação</button>}</div>
    {confirmar && <div className="notice"><p>Remover sua avaliação deste produto?</p><div className="checkout-actions"><button className="pill" type="button" disabled={ocupado} onClick={() => executar(true)}>Confirmar remoção</button><button className="pill" type="button" disabled={ocupado} onClick={() => setConfirmar(false)}>Manter avaliação</button></div></div>}
  </form>;
}

function ConsultaAvaliacoes({ produtoId, usuarioId }) {
  const [resultado, setResultado] = useState(undefined);
  const [minha, setMinha] = useState(undefined);
  const [erro, setErro] = useState('');
  const [erroMinha, setErroMinha] = useState('');
  const [pagina, setPagina] = useState(0);
  const [versao, setVersao] = useState(0);
  const [mensagem, setMensagem] = useState('');
  useEffect(() => {
    let ativo = true;
    consultarAvaliacoes(produtoId, pagina).then((dados) => {
      if (!ativo) return;
      setResultado(dados);
      if (dados !== null && usuarioId) buscarMinhaAvaliacao(produtoId, usuarioId).then((avaliacao) => { if (ativo) setMinha(avaliacao); }, (error) => { if (ativo) setErroMinha(error.message); });
    }, (error) => { if (ativo) setErro(error.message); });
    return () => { ativo = false; };
  }, [produtoId, usuarioId, pagina, versao]);
  function atualizar(texto = '') { setMensagem(texto); setErro(''); setErroMinha(''); setResultado(undefined); setMinha(undefined); setPagina(0); setVersao((v) => v + 1); }
  return <section className="product-reviews" aria-labelledby="titulo-avaliacoes">
    <div className="section-head"><div><p className="eyebrow">QUEM USA, COMPARTILHA</p><h2 id="titulo-avaliacoes">Avaliações do produto</h2></div><MessageSquare size={28} strokeWidth={1.3} aria-hidden="true" /></div>
    {mensagem && <p className="profile-success" role="status">{mensagem}</p>}
    {erro ? <div className="notice" role="alert"><p>{erro}</p><button className="pill" type="button" onClick={() => atualizar()}>Tentar novamente</button></div>
      : resultado === undefined ? <p role="status" className="text-muted">Carregando avaliações…</p>
        : resultado === null ? <p className="notice" role="status">Avaliações temporariamente indisponíveis. Você pode continuar consultando o produto e comprando normalmente.</p>
          : <div className="review-layout"><div>
            <div className="review-overview">{resultado.total > 0 ? <><strong>{Number(resultado.media).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<small> / 5</small></strong><div><Estrelas nota={Number(resultado.media)} /><p>{resultado.total} {resultado.total === 1 ? 'avaliação publicada' : 'avaliações publicadas'}</p></div></> : <><MessageSquare size={32} aria-hidden="true" /><div><h3>Ainda sem avaliações</h3><p>Seja a primeira pessoa a compartilhar uma opinião.</p></div></>}</div>
            <ul className="review-list">{(resultado.comentarios || []).map((item) => <li key={item.id}><div className="review-byline"><strong>Cliente</strong><time dateTime={item.criado_em}>{new Date(item.criado_em).toLocaleDateString('pt-BR')}</time></div><Estrelas nota={item.nota} />{item.comentario ? <p>{item.comentario}</p> : <p className="text-muted">Avaliação sem comentário.</p>}</li>)}</ul>
            {resultado.total > 8 && <nav className="review-pagination" aria-label="Páginas de avaliações"><button className="pill" type="button" disabled={pagina === 0} onClick={() => { setResultado(undefined); setPagina((p) => p - 1); }}>Anterior</button><span>Página {pagina + 1}</span><button className="pill" type="button" disabled={(pagina + 1) * 8 >= resultado.total} onClick={() => { setResultado(undefined); setPagina((p) => p + 1); }}>Próxima</button></nav>}
          </div><div className="panel review-compose">{usuarioId ? erroMinha ? <><p className="notice" role="alert">{erroMinha}</p><button className="pill" type="button" onClick={() => atualizar()}>Tentar novamente</button></> : minha === undefined ? <p role="status">Consultando sua avaliação…</p> : <ReviewForm key={versao} minha={minha} produtoId={produtoId} usuarioId={usuarioId} onChanged={atualizar} /> : <><h3>Sua opinião faz parte.</h3><p className="text-muted">Entre na sua conta para avaliar este produto.</p><Link className="pill primary" to={caminhoAcesso('/login', `/produto/${produtoId}`)}>Entrar para avaliar</Link></>}</div></div>}
  </section>;
}

export default function ProductReviews({ produtoId }) {
  const session = useSessao();
  const usuarioId = session?.user.id;
  return <ConsultaAvaliacoes key={`${produtoId}:${usuarioId || 'visitante'}`} produtoId={produtoId} usuarioId={usuarioId} />;
}
