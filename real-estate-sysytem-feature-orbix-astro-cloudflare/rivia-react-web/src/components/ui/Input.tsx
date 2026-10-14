import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  icon?: ReactNode;
}

export function Input({ label, helper, icon, className = '', ...props }: InputProps) {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <span className={`input-shell ${className}`}>
        {icon ? <span className="input-icon">{icon}</span> : null}
        <input {...props} />
      </span>
      {helper ? <span className="field-helper">{helper}</span> : null}
    </label>
  );
}

