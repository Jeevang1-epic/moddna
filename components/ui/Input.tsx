import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/client/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      'w-full rounded-xl border border-slate-700/90 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus-visible:border-indigo-400/90 focus-visible:ring-2 focus-visible:ring-indigo-400/30 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus-visible:ring-rose-400/30',
      className
    )}
    {...props}
  />
);
