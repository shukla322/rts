import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from './cx'

/**
 * The one container surface used everywhere.
 *  - surface:   white card with a hairline border (default)
 *  - muted:     soft pink panel, for secondary or inactive content
 *  - highlight: light-orange panel with an orange edge, for the active / selected item
 */
export type CardTone = 'surface' | 'muted' | 'highlight'

const TONE: Record<CardTone, string> = {
  surface: 'bg-bg-white border border-header-purple/10',
  muted: 'bg-bg-beige/60 border border-transparent',
  highlight: 'bg-light-orange border border-highlight-orange ring-1 ring-highlight-orange',
}

const PAD = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' } as const

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone
  pad?: keyof typeof PAD
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone = 'surface', pad = 'md', className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx('ui-card rounded-[18px] shadow-card', TONE[tone], PAD[pad], className)} {...rest} />
})

/** Title line for a card: title, optional subtitle, and optional controls on the right. */
export function CardHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex items-start justify-between gap-3 flex-wrap', className)}>
      <div className="min-w-0">
        <h3 className="font-display font-bold text-sm text-header-purple">{title}</h3>
        {subtitle && <p className="text-caption text-header-purple/60">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}
