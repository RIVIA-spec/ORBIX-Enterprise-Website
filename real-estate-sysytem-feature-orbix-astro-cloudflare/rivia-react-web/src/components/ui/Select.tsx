import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, helper, options, className = '', ...props }: SelectProps) {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <span className={`input-shell ${className}`}>
        <select {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      {helper ? <span className="field-helper">{helper}</span> : null}
    </label>
  );
}

