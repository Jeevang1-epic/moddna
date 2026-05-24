import type { ReactNode } from 'react';
import { cn } from '../../lib/client/cn';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export const Card = ({ children, className }: CardProps) => (
  <section
    className={cn(
      'rounded-xl border border-zinc-200 bg-white p-5 shadow-sm',
      className
    )}
  >
    {children}
  </section>
);
