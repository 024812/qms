import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-white/5 dark:border-white/10 dark:text-slate-200 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50 md:text-sm focus-visible:bg-black/20 dark:focus-visible:bg-black/40',
  {
    variants: {
      state: {
        default:
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-0',
        error:
          'border-destructive ring-destructive/20 dark:ring-destructive/40 focus-visible:border-destructive focus-visible:ring-destructive/30',
        success:
          'border-success ring-success/20 focus-visible:border-success focus-visible:ring-success/30',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>, VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, state, icon, iconPosition = 'left', ...props }, ref) => {
    // Determine state from aria-invalid if not explicitly provided
    const computedState = props['aria-invalid'] ? 'error' : state;

    if (icon) {
      return (
        <div className="relative">
          {iconPosition === 'left' && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            data-slot="input"
            className={cn(
              inputVariants({ state: computedState }),
              iconPosition === 'left' && 'pl-10',
              iconPosition === 'right' && 'pr-10',
              className
            )}
            {...props}
          />
          {iconPosition === 'right' && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(inputVariants({ state: computedState }), className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
