import type { ReactNode } from 'react';
import { cn } from '../../lib/client/cn';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

type BadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  default: 'border-slate-600/70 bg-slate-800/70 text-slate-200',
  success: 'border-emerald-400/25 bg-emerald-400/12 text-emerald-300',
  warning: 'border-amber-400/25 bg-amber-400/12 text-amber-300',
  danger: 'border-rose-400/25 bg-rose-400/12 text-rose-300',
  info: 'border-indigo-400/35 bg-indigo-500/16 text-indigo-200',
};

export const Badge = ({
  children,
  className,
  tone = 'default',
}: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
      toneClasses[tone],
      className
    )}
  >
    {children}
  </span>
);
