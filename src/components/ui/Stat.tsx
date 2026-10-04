import type { ReactNode } from 'react'
import { Card } from './Card'
import { Eyebrow } from './Typography'
import { cx } from './cx'

interface StatProps {
  label: ReactNode
  value: ReactNode
  /** Small line under the value: unit, comparison or context. */
  hint?: ReactNode
  /** md: dashboard and popup tiles. sm: compact tiles (Home strip, small cards). */
  size?: 'sm' | 'md'
  /** Plain value in the normal text colour instead of the red number highlight. */
  quiet?: boolean
  className?: string
}

/** The one metric tile: label, big number, hint. Used for every KPI and stat in the app. */
export function Stat({ label, value, hint, size = 'md', quiet, className }: StatProps) {
  return (
    <Card pad="none" className={cx(size === 'md' ? 'stat-tile stat-large px-4 py-4' : 'stat-tile px-3 py-3', className)}>
      <Eyebrow className="leading-snug">{label}</Eyebrow>
      <p
        className={cx(
          'font-display font-extrabold leading-tight mt-0.5',
          size === 'md' ? 'text-xl' : 'text-lg',
          quiet ? 'text-header-purple' : 'stat-value text-header-purple',
        )}
      >
        {value}
      </p>
      {hint && <p className="text-caption font-medium text-header-purple/60 leading-snug">{hint}</p>}
    </Card>
  )
}
