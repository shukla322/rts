import type { BoostReason } from '../data/types'
import { BOOST_REASON_META } from '../engine/boostReasons'

interface Props {
  reason: BoostReason
  /** 'short' = tag (CART), 'long' = full label (Cart overlap). */
  variant?: 'short' | 'long'
}

export default function BoostBadge({ reason, variant = 'long' }: Props) {
  const meta = BOOST_REASON_META[reason]
  return (
    <span
      title={`${meta.label}: ${meta.description}`}
      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-caption font-extrabold tracking-wide"
      style={{ background: meta.bg, color: meta.fg }}
    >
      {variant === 'short' ? meta.short : meta.label}
    </span>
  )
}
