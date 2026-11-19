import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({ className = 'forminput', ...props }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return <div className="password-field">
    <input {...props} className={className} type={visible ? 'text' : 'password'} />
    <button type="button" className="password-toggle" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      aria-pressed={visible} aria-controls={props.id} disabled={props.disabled}
      onMouseDown={(event) => event.preventDefault()} onClick={() => setVisible((value) => !value)}>
      <Icon size={20} aria-hidden="true" />
    </button>
  </div>;
}
