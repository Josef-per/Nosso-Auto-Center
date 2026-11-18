import { useState } from 'react';
const fallback = '/images/produtos/placeholder.svg';
function Image({ src, alt, eager, ...props }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const source = !src || /(?:^|\/)favicon\.svg(?:[?#]|$)/i.test(src) || failed ? fallback : src;
  return <img {...props} src={source} alt={source === fallback && alt ? `${alt} — imagem indisponível` : alt}
    loading={eager ? 'eager' : 'lazy'} decoding="async" data-loaded={loaded}
    onLoad={() => setLoaded(true)} onError={() => { if (source !== fallback) setFailed(true); }} />;
}
export default function ProductImage(props) {
  return <Image key={props.src} {...props} />;
}
