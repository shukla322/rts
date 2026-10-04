import type { ReactNode } from 'react'
import { cx } from './cx'

const TONE = {
  danger: 'bg-[#fbe4e2] text-[#a13b36]',
  info: 'bg-bg-beige text-header-purple/70',
} as const

/** Short inline message box, e.g. "Discount capped at 10% by seller contract". */
export function Notice({ tone = 'danger', children }: { tone?: keyof typeof TONE; children: ReactNode }) {
  return <p className={cx('rounded-lg px-2.5 py-1.5 text-caption font-bold leading-snug', TONE[tone])}>{children}</p>
}
