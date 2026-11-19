import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Warehouse } from 'lucide-react';
import { carregarResumoAdmin, listarProdutosAdmin, listarCategoriasAdmin, listarPedidosAdmin, desativarProdutoAdmin } from '../services/adminService';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ProductEditor from '../admin/ProductEditor';
import OrderManager from '../admin/OrderManager';
import { formatarPreco } from '../lib/formatarPreco';
import ProductImage from '../components/ProductImage';
export default function Admin() {
  const [dados, setDados] = useState(null);
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
    Promise.all([carregarResumoAdmin(), listarProdutosAdmin(), listarCategoriasAdmin(), listarPedidosAdmin()]).then(
      ([resumo, produtos, categorias, pedidos]) => { if (ativo) setDados({ resumo, produtos, categorias, pedidos }); },
      (error) => { if (ativo) setErro(error.message); },
    );
    return () => { ativo = false; };
  }, [versao]);
  function recarregar() { setErro(''); setVersao((n) => n + 1); }
  async function desativar() {
    setOcupado(alvo.id); setMensagem('');
    try { await desativarProdutoAdmin(alvo.id); setAlvo(null); setEditor(undefined); setMensagem('Produto desativado.'); recarregar(); }
    catch (error) { setErro(error.message); }
    finally { setOcupado(null); }
  }
  const produtos = dados?.produtos.filter((p) => (p.nome + ' ' + (p.marca ?? '')).toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')) && (situacao === 'todos' || (situacao === 'ativos' ? p.ativo : situacao === 'inativos' ? !p.ativo : p.estoque === 0))) ?? [];
  return <div className="container admin-page">
    <div className="page-heading"><nav className="crumb" aria-label="Localização"><Link to="/minha-conta">Minha conta</Link> / Administração</nav><h1>Visão da operação</h1><p className="text-muted">Gerencie o catálogo e acompanhe os pedidos demonstrativos.</p></div>
    {erro && <ErrorState title="Não foi possível concluir a operação" message={erro} onRetry={recarregar} />}
    {mensagem && <p role="status" className="profile-success">{mensagem}</p>}
    {!dados && !erro && <LoadingState message="Carregando administração…" />}
    {dados && <>
      <div className="admin-stats"><article className="panel"><Package aria-hidden="true" /><span>Produtos ativos</span><strong>{dados.resumo.produtos_ativos}</strong></article><article className="panel"><Warehouse aria-hidden="true" /><span>Produtos sem estoque</span><strong>{dados.resumo.sem_estoque}</strong></article><article className="panel"><ShoppingBag aria-hidden="true" /><span>Pedidos registrados</span><strong>{dados.resumo.pedidos}</strong></article></div>
      <div className="section-head admin-heading"><div><h2>Catálogo de produtos</h2><p>Cadastre, edite ou retire produtos da vitrine.</p></div><div className="checkout-actions"><button className="pill" type="button" disabled={ocupado !== null} onClick={recarregar}>Atualizar dados</button><button className="pill primary" type="button" onClick={() => setEditor(null)}>Novo produto</button></div></div>
      {editor !== undefined && <ProductEditor key={editor?.id ?? 'novo'} produto={editor} categorias={dados.categorias} onCancel={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setMensagem('Produto salvo no catálogo.'); recarregar(); }} />}
      <div className="admin-toolbar"><div><label className="field" htmlFor="admin-busca">Buscar no catálogo</label><input className="forminput" id="admin-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou marca" /></div><div><label className="field" htmlFor="admin-situacao">Situação</label><select id="admin-situacao" className="forminput" value={situacao} onChange={(e) => setSituacao(e.target.value)}><option value="todos">Todos os produtos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="sem-estoque">Sem estoque</option></select></div></div>
      {produtos.length ? <div className="admin-table-wrap"><table className="admin-table"><caption>{produtos.length} produtos no catálogo administrativo</caption><thead><tr><th scope="col">Produto</th><th scope="col">Preço</th><th scope="col">Estoque</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead><tbody>{produtos.map((p) => <tr key={p.id}><th scope="row"><div className="admin-product"><ProductImage src={p.imagem_url} alt="" /><span>{p.nome}<small>{p.marca}</small></span></div></th><td>{formatarPreco(Number(p.preco))}</td><td>{p.estoque}</td><td><span className="status-badge" data-active={p.ativo}>{p.ativo ? 'Ativo' : 'Inativo'}</span></td><td><div className="admin-row-actions"><button className="pill" type="button" disabled={ocupado !== null} aria-label={'Editar ' + p.nome} onClick={() => setEditor(p)}>Editar</button>{p.ativo && <button className="pill" type="button" disabled={ocupado !== null} aria-label={'Desativar ' + p.nome} onClick={() => setAlvo(p)}>Desativar</button>}</div></td></tr>)}</tbody></table></div> : <EmptyState title="Nenhum produto encontrado" />}
      {alvo && <section className="notice" aria-label="Confirmar desativação"><p>Retirar “{alvo.nome}” do catálogo? Os pedidos existentes serão preservados.</p><div className="checkout-actions"><button className="pill" type="button" disabled={ocupado !== null} onClick={desativar}>{ocupado ? 'Desativando…' : 'Confirmar desativação'}</button><button className="pill" type="button" disabled={ocupado !== null} onClick={() => setAlvo(null)}>Manter ativo</button></div></section>}
      <OrderManager pedidos={dados.pedidos} onChanged={recarregar} />
    </>}
  </div>;
}
