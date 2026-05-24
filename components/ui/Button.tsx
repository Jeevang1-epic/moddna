import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/client/cn';

type ButtonTone = 'primary' | 'neutral' | 'subtle';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  fullWidth?: boolean;
};

const toneClasses: Record<ButtonTone, string> = {
  primary:
    'bg-orange-600 text-white hover:bg-orange-500 active:bg-orange-700 disabled:bg-orange-300',
  neutral:
    'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 disabled:bg-zinc-400',
  subtle:
    'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400',
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
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
      toneClasses[tone],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  />
);
