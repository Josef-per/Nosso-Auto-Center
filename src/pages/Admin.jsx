import SelectField from '../components/SelectField';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, RefreshCw } from 'lucide-react';
import AdminDashboard from '../admin/AdminDashboard';
import { listarProdutosAdmin, listarCategoriasAdmin, listarPedidosAdmin, desativarProdutoAdmin } from '../services/adminService';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ProductEditor from '../admin/ProductEditor';
import OrderManager from '../admin/OrderManager';
import { formatarPreco } from '../lib/formatarPreco';
import ProductImage from '../components/ProductImage';
export default function Admin() {
  const [dados, setDados] = useState(null);
  const [atualizando, setAtualizando] = useState(false);
  const { hash } = useLocation();
  const navigate = useNavigate();
  const secao = hash === '#produtos' ? 'produtos' : hash === '#pedidos' ? 'pedidos' : 'visao-geral';
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);
  const [editor, setEditor] = useState(undefined);
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('todos');
  const [ocupado, setOcupado] = useState(null);
  const [alvo, setAlvo] = useState(null);
  const [mensagem, setMensagem] = useState('');
  useEffect(() => {
    let ativo = true;
    Promise.all([listarProdutosAdmin(), listarCategoriasAdmin(), listarPedidosAdmin()]).then(
      ([produtos, categorias, pedidos]) => { if (ativo) { setDados({ produtos, categorias, pedidos }); setAtualizando(false); } },
      (error) => { if (ativo) { setErro(error.message); setAtualizando(false); } },
    );
    return () => { ativo = false; };
  }, [versao]);
  function recarregar() { setAtualizando(true); setErro(''); setVersao((n) => n + 1); }
  async function desativar() {
    setOcupado(alvo.id); setMensagem('');
    try { await desativarProdutoAdmin(alvo.id); setAlvo(null); setEditor(undefined); setMensagem('Produto desativado.'); recarregar(); }
    catch (error) { setErro(error.message); }
    finally { setOcupado(null); }
  }
  const produtos = dados?.produtos.filter((p) => (p.nome + ' ' + (p.marca ?? '')).toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')) && (situacao === 'todos' || (situacao === 'ativos' ? p.ativo : situacao === 'inativos' ? !p.ativo : p.estoque === 0))) ?? [];
  return <div className="container admin-page">
    <div className="page-heading"><nav className="crumb" aria-label="Localização"><Link to="/minha-conta">Minha conta</Link> / Administração</nav><h1>Administração</h1><p className="text-muted">Gerencie o catálogo e acompanhe os pedidos demonstrativos.</p></div>
    {erro && <ErrorState title="Não foi possível concluir a operação" message={erro} onRetry={recarregar} />}
    {mensagem && <p role="status" className="profile-success">{mensagem}</p>}
    {!dados && !erro && <LoadingState message="Carregando administração…" />}
    {dados && <>
      <div className="admin-workspace-bar"><nav className="admin-tabs" aria-label="Seções da administração">{[{id:'visao-geral',label:'Visão geral',Icon:LayoutDashboard},{id:'produtos',label:'Produtos',Icon:Package},{id:'pedidos',label:'Pedidos',Icon:ShoppingBag}].map(({id,label,Icon}) => <Link key={id} to={'/admin#'+id} aria-current={secao===id ? 'page' : undefined}><Icon size={18} aria-hidden="true" />{label}</Link>)}</nav><button className="pill" type="button" disabled={atualizando || ocupado !== null} onClick={recarregar}><RefreshCw size={16} aria-hidden="true" />{atualizando ? 'Atualizando…' : 'Atualizar dados'}</button></div>
      <p className="dashboard-demo-notice"><strong>Dados demonstrativos — pagamentos simulados</strong><span>Nenhuma cobrança ou pagamento real é processado neste sistema.</span></p>
      {atualizando && <p role="status" className="text-muted">Atualizando catálogo, pedidos e indicadores…</p>}
      {secao === 'visao-geral' && <AdminDashboard versao={versao} pedidos={dados.pedidos} onOrders={() => navigate('/admin#pedidos')} onEdit={(produto) => { const existente = dados.produtos.find((item) => String(item.id) === String(produto.id)); if (existente) setEditor(existente); else { setBusca(produto.nome); navigate('/admin#produtos'); } }} />}
      {editor !== undefined && <ProductEditor key={editor?.id ?? 'novo'} produto={editor} categorias={dados.categorias} onCancel={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setMensagem('Produto salvo no catálogo.'); recarregar(); }} />}
      <section id="produtos" hidden={secao !== 'produtos'} aria-labelledby="titulo-catalogo" tabIndex={-1}>
      <div className="section-head admin-heading"><div><h2 id="titulo-catalogo">Catálogo de produtos</h2><p>Cadastre, edite ou retire produtos da vitrine.</p></div><div className="checkout-actions"><button className="pill primary" type="button" onClick={() => setEditor(null)}>Novo produto</button></div></div>

      <div className="admin-toolbar"><div><label className="field" htmlFor="admin-busca">Buscar no catálogo</label><input className="forminput" id="admin-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou marca" /></div><div><label className="field" htmlFor="admin-situacao">Situação</label><SelectField id="admin-situacao" className="forminput" value={situacao} onChange={(e) => setSituacao(e.target.value)}><option value="todos">Todos os produtos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="sem-estoque">Sem estoque</option></SelectField></div></div>
      {produtos.length ? <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Catálogo de produtos"><table className="admin-table"><caption>{produtos.length} produtos no catálogo administrativo</caption><thead><tr><th scope="col">Produto</th><th scope="col">Preço</th><th scope="col">Estoque</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead><tbody>{produtos.map((p) => <tr key={p.id}><th scope="row"><div className="admin-product"><ProductImage src={p.imagem_url} alt="" /><span>{p.nome}<small>{p.marca}</small></span></div></th><td>{formatarPreco(Number(p.preco))}</td><td>{p.estoque}</td><td><span className="status-badge" data-active={p.ativo}>{p.ativo ? 'Ativo' : 'Inativo'}</span></td><td><div className="admin-row-actions"><button className="pill" type="button" disabled={ocupado !== null} aria-label={'Editar ' + p.nome} onClick={() => setEditor(p)}>Editar</button>{p.ativo && <button className="pill danger" type="button" disabled={ocupado !== null} aria-label={'Desativar ' + p.nome} onClick={() => setAlvo(p)}>Desativar</button>}</div></td></tr>)}</tbody></table></div> : <EmptyState title="Nenhum produto encontrado" />}
      {alvo && <section className="notice" aria-label="Confirmar desativação"><p>Retirar “{alvo.nome}” do catálogo? Os pedidos existentes serão preservados.</p><div className="checkout-actions"><button className="pill danger" type="button" disabled={ocupado !== null} onClick={desativar}>{ocupado ? 'Desativando…' : 'Confirmar desativação'}</button><button className="pill" type="button" disabled={ocupado !== null} onClick={() => setAlvo(null)}>Manter ativo</button></div></section>}
      </section>
      <div id="pedidos" hidden={secao !== 'pedidos'} tabIndex={-1}><OrderManager pedidos={dados.pedidos} onChanged={recarregar} /></div>
    </>}
  </div>;
}
