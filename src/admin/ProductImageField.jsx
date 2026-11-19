import { useEffect, useRef, useState } from 'react';
import FormField from '../components/FormField';
import { urlImagemPermitida, validarImagemProduto } from '../lib/imagemProduto';

export default function ProductImageField({ url, onUrl, arquivo, onArquivo, onValidando, origem, onOrigem }) {
  const [preview, setPreview] = useState('');
  const [erro, setErro] = useState('');
  const [falhaPreview, setFalhaPreview] = useState('');
  const objetoUrl = useRef('');
  const sequencia = useRef(0);
  const input = useRef(null);
  useEffect(() => () => { sequencia.current++; if (objetoUrl.current) URL.revokeObjectURL(objetoUrl.current); }, []);

  function limparArquivo(limparCampo = true) {
    sequencia.current++;
    if (objetoUrl.current) URL.revokeObjectURL(objetoUrl.current);
    objetoUrl.current = '';
    setPreview(''); setErro(''); setFalhaPreview(''); onArquivo(null); onValidando(false);
    if (limparCampo && input.current) input.current.value = '';
  }
  async function selecionar(event) {
    const selecionado = event.target.files?.[0];
    limparArquivo(false);
    if (!selecionado) return;
    const atual = ++sequencia.current;
    onValidando(true);
    try {
      await validarImagemProduto(selecionado);
      const bitmap = await createImageBitmap(selecionado);
      bitmap.close();
      if (atual !== sequencia.current) return;
      objetoUrl.current = URL.createObjectURL(selecionado);
      setPreview(objetoUrl.current); onArquivo(selecionado);
    } catch (error) { if (atual === sequencia.current) setErro(error instanceof DOMException ? 'Não foi possível abrir esta imagem. Selecione outro arquivo.' : error.message); }
    finally { if (atual === sequencia.current) onValidando(false); }
  }
  const src = origem === 'arquivo' ? preview : urlImagemPermitida(url.trim()) ? url.trim() : '';
  return <section className="checkout-wide admin-image-field" aria-labelledby="produto-imagem-titulo">
    <h3 id="produto-imagem-titulo">Imagem do produto</h3>
    <div className="admin-image-options" role="group" aria-label="Origem da imagem">
      <label><input type="radio" name="origem_imagem" value="url" checked={origem === 'url'} onChange={() => { limparArquivo(); onOrigem('url'); }} />Usar URL</label>
      <label><input type="radio" name="origem_imagem" value="arquivo" checked={origem === 'arquivo'} onChange={() => { onOrigem('arquivo'); setFalhaPreview(''); }} />Enviar do computador</label>
    </div>
    {origem === 'url' ? <FormField id="produto-imagem" name="imagem_url" label="URL da imagem autorizada (opcional)" maxLength={2000} value={url} onChange={(event) => { onUrl(event.target.value); setFalhaPreview(''); }} hint="Use HTTPS ou um arquivo local em /images/." />
      : <><label className="field" htmlFor="produto-arquivo">Arquivo de imagem</label><input ref={input} id="produto-arquivo" className="forminput" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" aria-describedby="produto-arquivo-ajuda" onChange={selecionar} />
        <p className="text-muted" id="produto-arquivo-ajuda">JPG, PNG ou WebP, até 2 MB. O envio acontece ao salvar o produto. Use somente imagens autorizadas.</p>
        {arquivo && <p className="text-muted">{arquivo.name} · {(arquivo.size / 1024).toFixed(0)} KB <button className="pill ghost" type="button" onClick={limparArquivo}>Descartar arquivo</button></p>}</>}
    {erro && <p className="field-error" role="alert">{erro}</p>}
    {src && falhaPreview !== src && <figure className="admin-image-preview"><img src={src} alt="Prévia da imagem do produto" onError={() => { setFalhaPreview(src); if (origem === 'arquivo') { onArquivo(null); setErro('Não foi possível abrir esta imagem. Selecione outro arquivo.'); } }} /><figcaption>Prévia · confira a peça e a autorização de uso antes de salvar.</figcaption></figure>}
    {src && falhaPreview === src && <p className="field-error" role="alert">Prévia indisponível. Confira a imagem selecionada.</p>}
  </section>;
}
