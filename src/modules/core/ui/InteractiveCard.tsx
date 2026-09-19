/**
 * InteractiveCard
 *
 * A card surface that becomes clickable when `onClick` is supplied.
 *
 * It renders a real `<button>` instead of a `<div>` carrying a synthetic
 * `role="button"`, `tabIndex` and a hand-written Enter/Space handler. A native
 * button is focusable, activates on Enter and Space, and exposes the correct
 * role to assistive technology — none of which has to be re-implemented (or
 * can silently drift) per module.
 *
 * When `onClick` is omitted the wrapper stays a plain `<div>`, so a
 * non-interactive card is not announced as a control.
 *
 * The button variant adds `w-full`, `text-left` and `cursor-pointer` because a
 * native button shrink-wraps and centres its text, whereas the `<div>` it
 * replaces filled its grid cell and showed a pointer cursor.
 */

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface InteractiveCardProps {
  /** Omit to render a non-interactive card. */
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

export function InteractiveCard({ onClick, className, children }: InteractiveCardProps) {
  if (!onClick) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={cn('w-full cursor-pointer text-left', className)}>
      {children}
    </button>
  );
}
