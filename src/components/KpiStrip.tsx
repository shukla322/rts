import { useMemo } from 'react'
import { HISTORY_WINDOW_DAYS } from '../data/assumptions'
import { kpis } from '../data/selectors'
import type { RunRecord } from '../data/types'
import { compactNum, inr, pct } from '../utils/format'
import { Stat } from './ui'

/** Headline numbers across the top of Home. One scrolling row on phones so the map stays near the top. */
export default function KpiStrip({ runs }: { runs: RunRecord[] }) {
  const k = useMemo(() => kpis(runs), [runs])
  const kmShare = k.kmBaseline === 0 ? 0 : k.kmAvoided / k.kmBaseline
  const costShare = k.costBaseline === 0 ? 0 : k.costSaved / k.costBaseline

  const tiles = [
    { label: `Returns · ${HISTORY_WINDOW_DAYS} days`, value: k.returns.toLocaleString('en-IN'), hint: `${k.sold.toLocaleString('en-IN')} resold` },
    { label: 'Resold', value: pct(k.resoldPct), hint: 'vs 0% today (all returned)' },
    { label: 'Km avoided', value: `${compactNum(k.kmAvoided)} km`, hint: `−${pct(kmShare)} reverse km vs today` },
    { label: 'Cost saved', value: inr(k.costSaved), hint: `−${pct(costShare)} reverse cost vs today` },
    {
      label: 'Avg time to resale',
      value: k.avgTimeToResaleDays === null ? '—' : `${k.avgTimeToResaleDays.toFixed(1)} days`,
      hint: 'today: no resale',
    },
  ]

  return (
    <section aria-label="Key metrics" className="shrink-0 bg-bg-beige/60 border-b border-header-purple/10 px-4 py-3">
      <div className="flex md:grid md:grid-cols-5 gap-2 overflow-x-auto md:overflow-visible">
        {tiles.map((t) => (
          <Stat key={t.label} size="sm" className="shrink-0 min-w-[150px] md:min-w-0" {...t} />
        ))}
      </div>
    </section>
  )
}
