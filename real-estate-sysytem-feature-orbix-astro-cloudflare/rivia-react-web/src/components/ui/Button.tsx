import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType, ReactNode } from 'react';

type ButtonProps = {
  as?: ElementType;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({
  as: Component = 'button',
  variant = 'primary',
  loading = false,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, fullWidth ? 'btn-full' : '', className].filter(Boolean).join(' ');

  return (
    <Component className={classes} disabled={disabled || loading} {...props}>
      {loading ? 'جاري المعالجة...' : children}
    </Component>
  );
}
