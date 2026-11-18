import { useId } from 'react';

export default function CampoQuantidade({ quantidade, limite, onChange, disabled, ariaLabel, onBlur, onKeyDown, invalid, describedBy }) {
  const id = useId();
  return (
    <div className="cart-quantity">
      <label className="field" htmlFor={id}>Quantidade</label>
      <input
        className="forminput"
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={limite}
        step={1}
        value={quantidade}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        aria-label={ariaLabel}
        required
      />
    </div>
  );
}
