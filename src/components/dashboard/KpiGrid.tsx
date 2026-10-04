import { useMemo } from 'react'
import { kpis } from '../../data/selectors'
import type { RunRecord } from '../../data/types'
import { compactNum, inr, pct } from '../../utils/format'
import { Stat } from '../ui'

/** Every headline number for the whole history, as a grid of metric tiles. */
export default function KpiGrid({ runs }: { runs: RunRecord[] }) {
  const k = useMemo(() => kpis(runs), [runs])
  const conv = k.conversionByLayer
  const kmShare = k.kmBaseline === 0 ? 0 : k.kmAvoided / k.kmBaseline
  const costShare = k.costBaseline === 0 ? 0 : k.costSaved / k.costBaseline

  const tiles: { label: string; value: string; hint: string }[] = [
    { label: 'Returns', value: k.returns.toLocaleString('en-IN'), hint: `${k.sold.toLocaleString('en-IN')} resold` },
    { label: 'Resold', value: pct(k.resoldPct, 1), hint: 'vs 0% today' },
    { label: 'Km avoided', value: `${compactNum(k.kmAvoided)} km`, hint: `−${pct(kmShare)} vs today` },
    { label: 'Cost saved', value: inr(k.costSaved), hint: `−${pct(costShare)} vs today` },
    {
      label: 'Avg time to resale',
      value: k.avgTimeToResaleDays === null ? '—' : `${k.avgTimeToResaleDays.toFixed(1)} days`,
      hint: 'resold parcels only',
    },
    {
      label: 'Avg discount',
      value: k.avgDiscountPct === null ? '—' : pct(k.avgDiscountPct, 1),
      hint: 'on resold parcels',
    },
    { label: 'Resale revenue recovered', value: inr(k.revenueRecovered), hint: 'sum of prices paid' },
    ...([1, 2, 3] as const).map((layer) => ({
      label: `Layer ${layer} conversion`,
      value: pct(conv[layer].rate, 1),
      hint: `${conv[layer].sold} sold of ${conv[layer].reached} reached`,
    })),
  ]

  return (
    <section className="dashboard-kpis" aria-label="Performance overview">
      <div className="dashboard-section-heading"><h2>Performance overview</h2><span>Across all returns</span></div>
      <div className="dashboard-primary-metrics">
        {tiles.slice(0, 4).map((t, index) => (
          <Stat key={t.label} className={index === 1 ? 'north-star metric-featured' : index === 3 ? 'metric-saffron' : 'metric-plum'} {...t} />
        ))}
      </div>
      <div className="dashboard-secondary-metrics">
        {tiles.slice(4).map((t) => <Stat key={t.label} {...t} />)}
      </div>
    </section>
  )
}
