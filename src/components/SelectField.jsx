import { Children, useCallback, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

// Mantém a interface de valores e eventos dos selects existentes e a integração FormData.
export default function SelectField({ children, value, defaultValue, onChange, name, required, disabled, id, className = '', ...props }) {
  const options = Children.toArray(children);
  const placeholder = options.find((option) => option.props.value === '')?.props.children ?? 'Selecione';
  const [container, setContainer] = useState();
  const triggerRef = useCallback((node) => {
    if (node) setContainer(node.closest('dialog') ?? undefined);
  }, []);
  return <Select.Root name={name} value={value === undefined ? undefined : String(value)} defaultValue={defaultValue === undefined ? undefined : String(defaultValue)} required={required} disabled={disabled}
    onValueChange={(next) => onChange?.({ target: { value: next, name }, currentTarget: { value: next, name } })}>
    <Select.Trigger {...props} id={id} ref={triggerRef} className={`forminput select-trigger ${className}`}>
      <Select.Value placeholder={placeholder} />
      <Select.Icon><ChevronDown size={18} aria-hidden="true" /></Select.Icon>
    </Select.Trigger>
    <Select.Portal container={container}>
      <Select.Content className="select-content" position="popper" sideOffset={6} collisionPadding={12}
        onEscapeKeyDown={(event) => event.stopPropagation()}>
        <Select.ScrollUpButton className="select-scroll"><ChevronUp size={18} aria-hidden="true" /></Select.ScrollUpButton>
        <Select.Viewport className="select-viewport">
          {options.filter((option) => option.props.value !== '').map((option) => <Select.Item
            className="select-option" key={option.props.value} value={String(option.props.value)} disabled={option.props.disabled}>
            <Select.ItemText>{option.props.children}</Select.ItemText>
            <Select.ItemIndicator><Check size={17} aria-hidden="true" /></Select.ItemIndicator>
          </Select.Item>)}
        </Select.Viewport>
        <Select.ScrollDownButton className="select-scroll"><ChevronDown size={18} aria-hidden="true" /></Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}
