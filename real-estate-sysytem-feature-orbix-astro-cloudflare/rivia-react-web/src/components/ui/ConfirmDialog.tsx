import { Button } from './Button';
import { Card } from './Card';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel = 'تأكيد', onConfirm, onClose }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <Card className="confirm-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        {description && <p className="muted">{description}</p>}
        <div className="inline-actions">
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        </div>
      </Card>
    </div>
  );
}

