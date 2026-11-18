export default function FormField({ id, label, error, hint, className = '', ...props }) {
  const description = [error && id + '-erro', hint && id + '-ajuda'].filter(Boolean).join(' ') || undefined;
  return <div className={className}>
    <label className="field" htmlFor={id}>{label}</label>
    <input className="forminput" id={id} aria-invalid={error ? true : undefined} aria-describedby={description} {...props} />
    {hint && <small className="text-muted" id={id + '-ajuda'}>{hint}</small>}
    {error && <p className="field-error" id={id + '-erro'} role="alert">{error}</p>}
  </div>;
}
