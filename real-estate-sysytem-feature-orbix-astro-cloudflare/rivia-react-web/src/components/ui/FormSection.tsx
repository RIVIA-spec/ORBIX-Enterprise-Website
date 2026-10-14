import type { ReactNode } from 'react';
import { Card } from './Card';

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card className="form-section">
      <div className="form-section-heading">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="form-grid">{children}</div>
    </Card>
  );
}

