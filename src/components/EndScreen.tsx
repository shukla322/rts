import { AnimatePresence } from 'framer-motion'
import type { RouteMetrics, RunRecord } from '../data/types'
import type { SimState } from '../state/useSimulation'
import { inr, km } from '../utils/format'
import { Button, Card, Eyebrow, Modal } from './ui'

interface Props {
  state: SimState
  /** The RunRecord just produced by this simulation (baseline vs actual). */
  run: RunRecord | null
  onReset: () => void
}

/** End-of-run summary: who bought it, and this parcel's baseline vs Return-to-Sale. */
export default function EndScreen({ state, run, onReset }: Props) {
  const { phase, boughtAt } = state
  const open = phase === 'bought' || phase === 'unsold'

  // Net of the discount handed to the buyer — the operator's real saving.
  const netSavings =
    run && run.outcome === 'sold' ? run.avoided.cost - (run.listPrice - (run.pricePaid ?? run.listPrice)) : 0
  const netSavingsPercent = run && run.baseline.cost > 0 ? (netSavings / run.baseline.cost) * 100 : 0

  return (
    <AnimatePresence>
      {open && (
        <Modal label="Return summary" placement="center" className="text-center py-8 px-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-bg-beige flex items-center justify-center text-3xl">
              {phase === 'bought' ? '✅' : '↩️'}
            </div>
            <h2 className="font-display font-bold text-lg text-header-purple">
              {phase === 'bought' ? `Someone in ${boughtAt?.city ?? 'transit'} bought the product` : 'Return Completed'}
            </h2>
            <p className="text-sm text-header-purple/70">
              {phase === 'bought'
                ? `To be delivered in ${run?.timeToResaleDays ?? 2} days${run?.pricePaid ? ` for ${inr(run.pricePaid)}` : ''}.`
                : 'No buyer along the way — the item has been sent back to origin, unsold.'}
            </p>
          </div>

          {run && (
            <Card tone="highlight" pad="sm" className="mt-4 text-left">
              <div className="grid grid-cols-3 gap-x-2 gap-y-1 items-baseline text-body">
                <span />
                <Eyebrow>Today</Eyebrow>
                <Eyebrow className="!text-highlight-orange">Return-to-Sale</Eyebrow>
                <MetricRow label="Legs" a={run.baseline} b={run.actual} pick={(m) => String(m.legs)} />
                <MetricRow label="Distance" a={run.baseline} b={run.actual} pick={(m) => km(m.km)} />
                <MetricRow label="Transit cost" a={run.baseline} b={run.actual} pick={(m) => inr(m.cost)} />
              </div>
              <p className="mt-2 text-caption font-semibold text-header-purple/70">
                Avoided: {run.avoided.legs} {run.avoided.legs === 1 ? 'leg' : 'legs'} · {km(run.avoided.km)} ·{' '}
                {inr(run.avoided.cost)}
              </p>
            </Card>
          )}

          {run && boughtAt?.layer === 3 && (
            <p className="mt-3 text-sm font-bold text-num-red">
              Valmo saves {netSavingsPercent.toFixed(0)}% ({inr(netSavings)}) off the original Reverse Logistics Costs.
            </p>
          )}

          <Button size="lg" full className="mt-6" onClick={onReset}>
            Reset Simulation
          </Button>
        </Modal>
      )}
    </AnimatePresence>
  )
}

function MetricRow({
  label,
  a,
  b,
  pick,
}: {
  label: string
  a: RouteMetrics
  b: RouteMetrics
  pick: (m: RouteMetrics) => string
}) {
  return (
    <>
      <span className="font-semibold text-header-purple/70">{label}</span>
      <span className="font-display font-bold text-header-purple/70">{pick(a)}</span>
      <span className="font-display font-extrabold text-num-red">{pick(b)}</span>
    </>
  )
}
