import { useMemo, useState } from 'react'
import { CATEGORIES } from '../../data/catalog'
import { SELLERS } from '../../data/sellers'
import {
  byBoostReason,
  byCategory,
  byNode,
  bySeller,
  type OutcomeBreakdownRow,
} from '../../data/selectors'
import type { CategoryId, Layer, RunRecord } from '../../data/types'
import { BOOST_REASON_META } from '../../engine/boostReasons'
import { pct } from '../../utils/format'
import { Card, CardHeader, Disclosure, Select } from '../ui'
import { LAYER_COLOR, LAYER_LABEL } from './chartColors'

interface Segment {
  key: string
  label: string
  value: number
  color: string
}

interface BarRow {
  id: string
  name: string
  segments: Segment[]
  trailing: string
}

const SEGMENT_KEYS: (Layer | 'unsold')[] = [1, 2, 3, 'unsold']

function outcomeRows(rows: OutcomeBreakdownRow[], hideEmpty = false): BarRow[] {
  return rows
    .filter((r) => !hideEmpty || r.returns > 0)
    .map((r) => ({
      id: r.id,
      name: r.name,
      segments: SEGMENT_KEYS.map((key) => ({
        key: String(key),
        label: LAYER_LABEL[key],
        value: key === 'unsold' ? r.unsold : r.soldByLayer[key],
        color: LAYER_COLOR[key],
      })),
      trailing: `${pct(r.resoldPct)} resold · ${r.returns}`,
    }))
}

function BarCard({
  title,
  subtitle,
  rows,
  legend,
  headerExtra,
}: {
  title: string
  subtitle: string
  rows: BarRow[]
  legend: { label: string; color: string }[]
  headerExtra?: React.ReactNode
}) {
  const max = Math.max(1, ...rows.map((r) => r.segments.reduce((a, s) => a + s.value, 0)))

  return (
    <Card className="flex flex-col gap-3">
      <CardHeader title={title} subtitle={subtitle} actions={headerExtra} />

      {legend.length > 1 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5 text-caption text-header-purple/70">
              <span className="h-2 w-2 rounded-sm" style={{ background: l.color }} aria-hidden />
              {l.label}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-1.5">
        {rows.map((r) => {
          const total = r.segments.reduce((a, s) => a + s.value, 0)
          return (
            <div key={r.id} className="flex items-center gap-2.5 text-caption">
              <span className="w-24 sm:w-28 shrink-0 truncate font-semibold text-header-purple" title={r.name}>
                {r.name}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="flex h-3 gap-[2px]"
                  style={{ width: `${(total / max) * 100}%`, minWidth: total > 0 ? 4 : 0 }}
                >
                  {r.segments
                    .filter((s) => s.value > 0)
                    .map((s) => (
                      <div
                        key={s.key}
                        title={`${r.name} · ${s.label}: ${s.value}`}
                        className="h-full rounded-[3px] first:rounded-l-full last:rounded-r-full"
                        style={{ flex: s.value, background: s.color }}
                      />
                    ))}
                </div>
              </div>
              <span className="shrink-0 text-right text-header-purple/70 tabular-nums">{r.trailing}</span>
            </div>
          )
        })}
      </div>

      <Disclosure title="View as table">
        <div className="overflow-x-auto">
          <table className="w-full text-caption text-header-purple">
            <thead>
              <tr className="text-left text-header-purple/60">
                <th className="py-1 pr-3 font-bold" />
                {rows[0]?.segments.map((s) => (
                  <th key={s.key} className="py-1 pr-3 font-bold">
                    {s.label}
                  </th>
                ))}
                <th className="py-1 font-bold">Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-header-purple/10">
                  <td className="py-1 pr-3 font-semibold">{r.name}</td>
                  {r.segments.map((s) => (
                    <td key={s.key} className="py-1 pr-3 tabular-nums">
                      {s.value}
                    </td>
                  ))}
                  <td className="py-1 whitespace-nowrap">{r.trailing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>
    </Card>
  )
}

export default function Breakdowns({ runs }: { runs: RunRecord[] }) {
  const [reasonCategory, setReasonCategory] = useState<CategoryId | ''>('')

  const categoryRows = useMemo(() => outcomeRows(byCategory(runs)), [runs])
  const nodeRows = useMemo(() => outcomeRows(byNode(runs)), [runs])
  const sellerRows = useMemo(() => outcomeRows(bySeller(runs, SELLERS)), [runs])
  const reasons = useMemo(() => byBoostReason(runs, reasonCategory || undefined), [runs, reasonCategory])

  const legend = SEGMENT_KEYS.map((key) => ({ label: LAYER_LABEL[key], color: LAYER_COLOR[key] }))
  const reasonRows: BarRow[] = reasons.rows.map((r) => ({
    id: r.reason,
    name: BOOST_REASON_META[r.reason].label,
    segments: [{ key: r.reason, label: 'Layer 2 resales', value: r.count, color: BOOST_REASON_META[r.reason].bg }],
    trailing: `${pct(r.share)} · ${r.count}`,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <BarCard
        title="By category"
        subtitle="Returns by where they sold, and the share resold"
        rows={categoryRows}
        legend={legend}
      />
      <BarCard
        title="By seller"
        subtitle="Returns by where they sold, and the share resold"
        rows={sellerRows}
        legend={legend}
      />
      <BarCard
        title="By region / node"
        subtitle="Grouped by destination node (where the return lands)"
        rows={nodeRows}
        legend={legend}
      />
      <BarCard
        title="By boost reason"
        subtitle={`Share of ${reasonCategory ? CATEGORIES.find((c) => c.id === reasonCategory)!.name : 'all'} Layer 2 resales (${reasons.total}) by the winner's primary reason`}
        rows={reasonRows}
        legend={[]}
        headerExtra={
          <Select
            size="sm"
            aria-label="Category for boost reasons"
            value={reasonCategory}
            options={[{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.name }))]}
            onChange={(v) => setReasonCategory(v as CategoryId | '')}
          />
        }
      />
    </div>
  )
}
