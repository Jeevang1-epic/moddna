import type { ReactNode } from 'react';
import { cn } from '../../lib/client/cn';

type CardTone = 'default' | 'muted';

type CardProps = {
  children: ReactNode;
  className?: string;
  tone?: CardTone;
  interactive?: boolean;
};

const toneClasses: Record<CardTone, string> = {
  default: 'border-slate-800/90 bg-slate-950/55',
  muted: 'border-slate-800/85 bg-slate-900/55',
};

export const Card = ({
  children,
  className,
  tone = 'default',
  interactive = false,
}: CardProps) => (
  <section
    className={cn(
      'rounded-2xl border p-5 shadow-[0_12px_42px_rgba(2,6,23,0.42)] backdrop-blur-sm sm:p-6',
      toneClasses[tone],
      interactive &&
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/45 hover:shadow-[0_18px_50px_rgba(79,70,229,0.24)]',
      className
    )}
  >
    {children}
  </section>
);
