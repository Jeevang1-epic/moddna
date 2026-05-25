import type { ReactNode } from 'react';
import { cn } from '../../lib/client/cn';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

type BadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  default: 'border-zinc-300 bg-zinc-100 text-zinc-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export const Badge = ({
  children,
  className,
  tone = 'default',
}: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
      toneClasses[tone],
      className
    )}
  >
    {children}
  </span>
);
