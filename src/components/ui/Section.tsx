import type { ReactNode } from 'react'
import { Card, type CardProps } from './Card'
import { Eyebrow } from './Typography'
import { cx } from './cx'

type SectionProps = {
  title: ReactNode
  /** Optional step number shown before the title (1, 2, 3 ...). */
  step?: number
  children: ReactNode
  className?: string
} & Pick<CardProps, 'tone' | 'pad'>

/** A titled block in a side panel: label above, card below. */
export function Section({ title, step, children, className, tone, pad }: SectionProps) {
  return (
    <section className={cx('flex flex-col gap-2', className)}>
      <div className="section-band flex items-center gap-2 px-1">
        {step !== undefined && (
          <span
            aria-hidden
            className="grid h-5 w-5 place-items-center rounded-full bg-header-purple text-caption font-extrabold text-bg-white"
          >
            {step}
          </span>
        )}
        <Eyebrow>{title}</Eyebrow>
      </div>
      <Card tone={tone} pad={pad}>
        {children}
      </Card>
    </section>
  )
}
