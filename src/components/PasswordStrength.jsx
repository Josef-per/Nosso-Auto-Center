import { avaliarForcaSenha } from '../lib/segurancaConta';

export default function PasswordStrength({ password, id }) {
  if (!password) return null;
  const { nivel, rotulo, previsivel } = avaliarForcaSenha(password);
  return <div className="password-strength" aria-live="polite">
    <div className="password-strength-meter" role="meter" aria-label="Força da senha" aria-valuemin={0} aria-valuemax={3} aria-valuenow={nivel} aria-valuetext={rotulo}>
      {[0, 1, 2, 3].map((parte) => <span key={parte} className={parte <= nivel ? `is-level-${nivel}` : ''} />)}
    </div>
    <small id={id} className="text-muted">Força da senha: <strong>{rotulo}</strong>{previsivel ? ' — escolha uma senha menos previsível.' : ''}</small>
  </div>;
}
