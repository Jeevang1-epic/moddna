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
        'text-lg font-semibold tracking-tight text-slate-100 sm:text-xl',
        className
      )}
    >
      {children}
    </h2>
    {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
  </div>
);
