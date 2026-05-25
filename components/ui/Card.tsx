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
  default: 'border-zinc-200 bg-white',
  muted: 'border-zinc-200/80 bg-zinc-50/70',
};

export const Card = ({
  children,
  className,
  tone = 'default',
  interactive = false,
}: CardProps) => (
  <section
    className={cn(
      'rounded-2xl border p-5 shadow-sm',
      toneClasses[tone],
      interactive &&
        'transition-transform transition-shadow hover:-translate-y-px hover:shadow-md',
      className
    )}
  >
    {children}
  </section>
);
