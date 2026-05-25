import type { ReactNode } from 'react';
import { cn } from '../../lib/client/cn';

type SectionTitleProps = {
  children: ReactNode;
  className?: string;
  subtitle?: string;
};

export const SectionTitle = ({
  children,
  className,
  subtitle,
}: SectionTitleProps) => (
  <div className="space-y-1">
    <h2
      className={cn(
        'text-lg font-semibold tracking-tight text-zinc-950',
        className
      )}
    >
      {children}
    </h2>
    {subtitle && <p className="text-sm text-zinc-600">{subtitle}</p>}
  </div>
);
