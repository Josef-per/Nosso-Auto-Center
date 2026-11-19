export default function ProductSkeleton({ count = 3 }) {
  return <div role="status"><span className="sr-only">Carregando produtos…</span><div className="skeleton-grid" aria-hidden="true">{Array.from({length: count}, (_, id) => <div className="skeleton-card" key={id}><span /><span /><span /><span /><span /><span /></div>)}</div></div>;
}
