import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ title, busy = false, dirty = false, onClose, children }) {
  const dialog = useRef(null);
  const titleId = useId();
  const [confirmar, setConfirmar] = useState(false);
  const continuar = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const origem = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    element.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')?.focus();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (origem?.isConnected) origem.focus();
    };
  }, []);
  useEffect(() => { if (confirmar) continuar.current?.focus(); }, [confirmar]);
  useEffect(() => {
    if (!dirty && !busy) return;
    function avisar(event) { event.preventDefault(); event.returnValue = ''; }
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [dirty, busy]);
  function solicitarFechamento() {
    if (busy) return;
    if (dirty) setConfirmar(true);
    else onClose();
  }
  return createPortal(<dialog ref={dialog} className="app-modal" aria-labelledby={titleId} aria-modal="true"
    onCancel={(event) => { event.preventDefault(); solicitarFechamento(); }}>
    <div className="modal-heading"><h2 id={titleId}>{title}</h2><button type="button" className="iconbtn" aria-label="Fechar modal" disabled={busy} onClick={solicitarFechamento}><X size={22} aria-hidden="true" /></button></div>
    <div className="modal-content">{children(solicitarFechamento)}</div>
    {confirmar && <section className="modal-discard" role="alert" aria-label="Alterações não salvas"><p>Existem alterações não salvas. Deseja descartá-las?</p><div className="checkout-actions"><button ref={continuar} type="button" className="pill" onClick={() => { setConfirmar(false); dialog.current.querySelector('input, select, textarea')?.focus(); }}>Continuar editando</button><button type="button" className="pill" disabled={busy} onClick={onClose}>Descartar alterações</button></div></section>}
  </dialog>, document.body);
}
