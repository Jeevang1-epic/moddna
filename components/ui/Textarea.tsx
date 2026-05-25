import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/client/cn';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = ({ className, ...props }: TextareaProps) => (
  <textarea
    className={cn(
      'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-200 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-100',
      className
    )}
    {...props}
  />
);
