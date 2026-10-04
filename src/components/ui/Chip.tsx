import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

/** Selectable pill, e.g. a category filter. */
export function Chip({ active, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cx(
        'rounded-full border px-2.5 py-1 text-caption font-bold transition-colors',
        active
          ? 'bg-highlight-orange border-highlight-orange text-header-purple'
          : 'bg-bg-white border-header-purple/20 text-header-purple/70 hover:text-header-purple',
        className,
      )}
      {...rest}
    />
  )
}

export type TagTone = 'accent' | 'neutral' | 'success' | 'danger'

const TAG: Record<TagTone, string> = {
  accent: 'bg-highlight-orange text-header-purple',
  neutral: 'bg-header-purple/10 text-header-purple/70',
  success: 'bg-[#e3f6e1] text-[#1f7a1f]',
  danger: 'bg-[#fbe4e2] text-[#a13b36]',
}

/** Small read-only label, e.g. "your run". */
export function Tag({ tone = 'neutral', children }: { tone?: TagTone; children: ReactNode }) {
  return (
    <span className={cx('inline-block rounded-full px-2 py-0.5 text-caption font-extrabold whitespace-nowrap', TAG[tone])}>
      {children}
    </span>
  )
}
