import { useMemo } from 'react'
import { BOOST_REASON_META, BOOST_REASON_ORDER, getLayer2PriorityList } from '../engine/boostReasons'
import { W_PRIORITY_DISTANCE, W_PRIORITY_REASON } from '../data/assumptions'
import type { MajorNodeId } from '../data/network'
import type { CategoryId } from '../data/types'
import type { SimState } from '../state/useSimulation'
import BoostBadge from './BoostBadge'
import { Button, Disclosure, Eyebrow, cx } from './ui'

interface Props {
  state: SimState
  categoryId: CategoryId
  /** Sell the parcel to this Layer 2 bidder. */
  onSold: (id: MajorNodeId) => void
}

type Status = 'queued' | 'pending' | 'passed' | 'bought'

const STATUS_LABEL: Record<Status, string> = {
  queued: 'queued',
  pending: 'bidding',
  passed: 'passed',
  bought: 'bought',
}

const STATUS_STYLE: Record<Status, string> = {
  queued: 'text-header-purple/40',
  pending: 'text-highlight-orange',
  passed: 'text-header-purple/40 line-through',
  bought: 'text-[#1f7a1f]',
}

/** "Layer 2 bidders · Priority list": bidders ranked by likelihood to buy, each with its own Sold button. */
export default function Layer2Bidders({ state, categoryId, onSold }: Props) {
  const { sscId, dscId } = state
  const bidders = useMemo(
    () => (sscId && dscId ? getLayer2PriorityList(sscId, dscId, categoryId) : []),
    [sscId, dscId, categoryId],
  )
  if (!sscId || !dscId) return null

  const statusOf = (id: string): Status => {
    if (state.phase === 'bought' && state.boughtAt?.layer === 2 && state.boughtAt.id === id) return 'bought'
    if (state.phase === 'layer1') return 'queued'
    if (state.phase === 'layer2') return state.layer2Pending.includes(id as never) ? 'pending' : 'passed'
    return 'passed'
  }

  return (
    <div className="flex flex-col gap-2 border-t border-header-purple/10 pt-3">
      <div>
        <Eyebrow>Layer 2 bidders · Priority list ({bidders.length})</Eyebrow>
        <p className="text-caption text-header-purple/60">
          Ranked by likelihood to buy: boosting reason ({Math.round(W_PRIORITY_REASON * 100)}%) and distance / travel
          cost ({Math.round(W_PRIORITY_DISTANCE * 100)}%).
        </p>
      </div>

      {bidders.length === 0 ? (
        <p className="text-caption text-header-purple/60">No sort centre is closer to the parcel than to the seller.</p>
      ) : (
        <ol className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
          {bidders.map((b, i) => {
            const status = statusOf(b.id)
            return (
              <li
                key={b.id}
                title={`${Math.round(b.kmToParcel)} km from the parcel · ${BOOST_REASON_META[b.primary].label}`}
                className="flex items-center gap-2 text-body"
              >
                <span className="w-4 shrink-0 text-right text-caption font-extrabold text-header-purple/45">{i + 1}</span>
                <span
                  className={cx('min-w-0 flex-1 truncate font-semibold text-header-purple', status === 'passed' && 'opacity-50')}
                >
                  {b.city}
                </span>
                <BoostBadge reason={b.primary} variant="short" />
                <span className="w-9 shrink-0 text-right font-display font-extrabold text-num-red tabular-nums">
                  {Math.round(b.priority * 100)}%
                </span>
                {status === 'pending' ? (
                  <Button
                    variant="success"
                    size="sm"
                    className="w-14 shrink-0 !px-0"
                    aria-label={`Sold to ${b.city}`}
                    onClick={() => onSold(b.id)}
                  >
                    Sold
                  </Button>
                ) : (
                  <span className={cx('w-14 shrink-0 text-center text-caption font-bold', STATUS_STYLE[status])}>
                    {STATUS_LABEL[status]}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      )}

      <Disclosure title="Badge legend">
        <ul className="flex flex-col gap-1.5">
          {BOOST_REASON_ORDER.map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-caption leading-snug text-header-purple/70">
              <span className="shrink-0 pt-px">
                <BoostBadge reason={reason} variant="short" />
              </span>
              <span>
                <b className="text-header-purple">{BOOST_REASON_META[reason].label}</b> —{' '}
                {BOOST_REASON_META[reason].description}
              </span>
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  )
}
