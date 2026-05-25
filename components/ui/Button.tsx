import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/client/cn';

type ButtonTone = 'primary' | 'neutral' | 'subtle';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  fullWidth?: boolean;
};

const toneClasses: Record<ButtonTone, string> = {
  primary:
    'border border-indigo-400/20 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:from-indigo-400 hover:to-violet-400 active:from-indigo-600 active:to-violet-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none',
  neutral:
    'border border-slate-600/70 bg-slate-900/95 text-slate-100 hover:bg-slate-800 active:bg-slate-700 disabled:border-slate-700 disabled:bg-slate-800/70 disabled:text-slate-500',
  subtle:
    'border border-slate-700/90 bg-slate-900/70 text-slate-100 hover:border-slate-500 hover:bg-slate-800/80 active:bg-slate-700/80 disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500',
};

export const Button = ({
  className,
  tone = 'primary',
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-150 hover:-translate-y-px active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/80 disabled:cursor-not-allowed disabled:transform-none',
      toneClasses[tone],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  />
);
