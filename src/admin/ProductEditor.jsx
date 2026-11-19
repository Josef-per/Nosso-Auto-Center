import SelectField from '../components/SelectField';
import { useRef, useState } from 'react';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { salvarProdutoAdmin } from '../services/adminService';
import { enviarImagemProduto } from '../services/imagemProdutoService';
import { urlImagemPermitida } from '../lib/imagemProduto';
import ProductImageField from './ProductImageField';

export default function ProductEditor({ produto, categorias, onSaved, onCancel }) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [alterado, setAlterado] = useState(false);
  const [imagemUrl, setImagemUrl] = useState(produto?.imagem_url ?? '');
  const [arquivoImagem, setArquivoImagem] = useState(null);
  const [validandoImagem, setValidandoImagem] = useState(false);
  const [etapa, setEtapa] = useState('');
  const [origemImagem, setOrigemImagem] = useState('url');
  const [uploadPendente, setUploadPendente] = useState(false);
  const imagemEnviada = useRef(null);
  const envio = useRef(false);
  async function salvar(event) {
    event.preventDefault();
    if (envio.current || validandoImagem) return;
    const dados = Object.fromEntries(new FormData(event.currentTarget));
    dados.id = produto?.id ?? null;
    dados.ativo = dados.ativo === 'on';
    dados.preco = Number(dados.preco);
    dados.preco_antigo = dados.preco_antigo === '' ? null : Number(dados.preco_antigo);
    dados.estoque = Number(dados.estoque);
    dados.imagem_url = imagemUrl.trim();
    delete dados.origem_imagem;
    if (!dados.nome.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dados.slug) || !dados.categoria_id
      || !Number.isFinite(dados.preco) || dados.preco < 0 || !Number.isSafeInteger(dados.estoque) || dados.estoque < 0) {
      setErro('Confira nome, slug, categoria, preço e estoque.'); return;
    }
    if (!arquivoImagem && !urlImagemPermitida(dados.imagem_url)) {
      setErro('Use uma URL HTTPS ou um caminho em /images/ para a imagem.'); return;
    }
    if (origemImagem === 'arquivo' && !arquivoImagem) { setErro('Selecione um arquivo de imagem válido antes de salvar.'); return; }
    envio.current = true;
    setSalvando(true); setErro('');
    try {
      if (arquivoImagem) {
        if (imagemEnviada.current?.arquivo !== arquivoImagem) {
          setEtapa('Enviando imagem…');
          const upload = await enviarImagemProduto(arquivoImagem);
          imagemEnviada.current = { ...upload, arquivo: arquivoImagem };
          setUploadPendente(true);
        }
        dados.imagem_url = imagemEnviada.current.url;
        setEtapa('Imagem enviada com sucesso. Salvando produto…');
      } else setEtapa('Salvando produto…');
      await salvarProdutoAdmin(dados); onSaved();
    }
    catch (error) { setErro(error.message); }
    finally { envio.current = false; setSalvando(false); setEtapa(''); }
  }
  return <Modal title={produto ? 'Editar produto' : 'Cadastrar produto'} busy={salvando} dirty={alterado} onClose={onCancel}>{(solicitarFechamento) =>
    <form onSubmit={salvar} onChange={() => setAlterado(true)} aria-busy={salvando || validandoImagem}><fieldset disabled={salvando}>
      <div className="checkout-fields">
        <FormField id="produto-nome" name="nome" label="Nome" defaultValue={produto?.nome ?? ''} required maxLength={200} />
        <FormField id="produto-slug" name="slug" label="Identificador (slug)" defaultValue={produto?.slug ?? ''} required maxLength={150} pattern="[a-z0-9]+(-[a-z0-9]+)*" hint="Use letras minúsculas, números e hífens." />
        <FormField id="produto-marca" name="marca" label="Marca" defaultValue={produto?.marca ?? ''} maxLength={100} />
        <div><label className="field" htmlFor="produto-categoria">Categoria</label><SelectField className="forminput" id="produto-categoria" name="categoria_id" required defaultValue={produto?.categoria_id ?? ''}><option value="">Selecione</option>{categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</SelectField></div>
        <FormField id="produto-preco" name="preco" label="Preço (R$)" type="number" min="0" max="99999999.99" step="0.01" required defaultValue={produto?.preco ?? ''} />
        <FormField id="produto-preco-antigo" name="preco_antigo" label="Preço anterior (opcional)" type="number" min="0" max="99999999.99" step="0.01" defaultValue={produto?.preco_antigo ?? ''} />
        <FormField id="produto-estoque" name="estoque" label="Estoque" type="number" min="0" max="2147483647" step="1" required defaultValue={produto?.estoque ?? 0} />
        <FormField id="produto-selo" name="selo" label="Selo (opcional)" maxLength={50} defaultValue={produto?.selo ?? ''} />
        <ProductImageField url={imagemUrl} onUrl={setImagemUrl} arquivo={arquivoImagem} origem={origemImagem} onOrigem={setOrigemImagem} onArquivo={(arquivo) => { setArquivoImagem(arquivo); imagemEnviada.current = null; setUploadPendente(false); }} onValidando={setValidandoImagem} />
        <div className="checkout-wide"><label className="field" htmlFor="produto-descricao">Descrição</label><textarea id="produto-descricao" name="descricao" className="forminput" rows={5} maxLength={10000} defaultValue={produto?.descricao ?? ''} /></div>
      </div>
      <label className="admin-active"><input type="checkbox" name="ativo" defaultChecked={produto?.ativo ?? true} />Disponível no catálogo</label>
      {erro && <p className="notice" role="alert">{erro}</p>}
      {etapa && <p className="text-muted" role="status">{etapa}</p>}
      {!salvando && erro && uploadPendente && <p className="notice">A imagem foi enviada, mas o vínculo não foi confirmado. Tente salvar novamente; o mesmo envio será reutilizado. A imagem anterior não foi excluída.</p>}
      <div className="checkout-actions"><button type="submit" className="pill primary" disabled={validandoImagem}>{validandoImagem ? 'Validando imagem…' : salvando ? 'Salvando…' : 'Salvar produto'}</button><button className="pill" type="button" onClick={solicitarFechamento}>Cancelar</button></div>
    </fieldset></form>}
  </Modal>;
}
