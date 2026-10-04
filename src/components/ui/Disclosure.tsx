import { useState, type ReactNode } from 'react'
import { cx } from './cx'

interface DisclosureProps {
  title: ReactNode
  /** Quiet line under the title (card variant only). */
  subtitle?: ReactNode
  defaultOpen?: boolean
  /** card: a full-width card with a chevron. inline: a small "show more" link. */
  variant?: 'card' | 'inline'
  children: ReactNode
  className?: string
}

/** Collapsible content. One component for the assumptions drawer, chart tables and legends. */
export function Disclosure({ title, subtitle, defaultOpen = false, variant = 'inline', children, className }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (variant === 'inline') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-1 text-caption font-bold text-header-purple/60 hover:text-header-purple"
        >
          <span aria-hidden className={cx('inline-block transition-transform', open ? 'rotate-90' : '')}>
            ▸
          </span>
          {title}
        </button>
        {open && <div className="mt-2">{children}</div>}
      </div>
    )
  }

  return (
    <section className={cx('rounded-xl bg-bg-white border border-header-purple/10', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block font-display font-bold text-sm text-header-purple">{title}</span>
          {subtitle && <span className="block text-caption text-header-purple/60">{subtitle}</span>}
        </span>
        <span aria-hidden className={cx('transition-transform text-header-purple/60', open ? 'rotate-180' : '')}>
          ▾
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  )
}
