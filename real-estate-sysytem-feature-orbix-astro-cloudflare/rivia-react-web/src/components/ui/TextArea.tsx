import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
}

export function TextArea({ label, helper, className = '', ...props }: TextAreaProps) {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <span className={`input-shell textarea-shell ${className}`}>
        <textarea {...props} />
      </span>
      {helper ? <span className="field-helper">{helper}</span> : null}
    </label>
  );
}

