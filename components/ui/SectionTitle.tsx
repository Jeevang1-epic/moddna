import type { ReactNode } from 'react';
import { cn } from '../../lib/client/cn';

type SectionTitleProps = {
  children: ReactNode;
  className?: string;
};

export const SectionTitle = ({ children, className }: SectionTitleProps) => (
  <h2 className={cn('text-xl font-semibold text-zinc-950', className)}>
    {children}
  </h2>
);
