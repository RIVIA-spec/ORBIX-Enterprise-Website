import type { ReactNode } from 'react';
import { Button } from './Button';

type DetailsDrawerProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function DetailsDrawer({ open, title, children, onClose }: DetailsDrawerProps) {
  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="details-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}

