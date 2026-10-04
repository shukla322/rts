import type { ReactNode } from 'react'
import { cx } from './cx'

/** Small uppercase label: section names, stat labels, table captions. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx('text-caption font-extrabold uppercase tracking-wider text-header-purple/60', className)}>
      {children}
    </p>
  )
}

/** Title block at the top of a full-page tab (Dashboard, RTS History, Sellers). */
export function PageHeader({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <header className="page-heading">
      <h2 className="font-display font-extrabold text-2xl text-header-purple leading-tight">{title}</h2>
      {subtitle && <p className="text-body text-header-purple/60">{subtitle}</p>}
    </header>
  )
}

/** Centred, width-limited column that every full-page tab sits in. */
export function PageShell({ children }: { children: ReactNode }) {
  return <div className="page-content mx-auto w-full max-w-[1040px] px-4 py-6 flex flex-col gap-5">{children}</div>
}
