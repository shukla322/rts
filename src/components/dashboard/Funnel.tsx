import { useMemo } from 'react'
import { funnel, type LayerFilter } from '../../data/selectors'
import type { RunRecord } from '../../data/types'
import { Button, Card, CardHeader, cx } from '../ui'
import { LAYER_FILL, LAYER_LABEL } from './chartColors'

interface Props {
  runs: RunRecord[]
  layerFilter: LayerFilter | undefined
  onLayerFilterChange: (filter: LayerFilter | undefined) => void
}

/** Returns -> Layer 1 -> Layer 2 -> Layer 3 -> unsold. Click a stage to filter the breakdowns below. */
export default function Funnel({ runs, layerFilter, onLayerFilterChange }: Props) {
  const f = useMemo(() => funnel(runs), [runs])
  const total = Math.max(1, f.returns)
  const toggle = (next: LayerFilter) => onLayerFilterChange(layerFilter === next ? undefined : next)

  return (
    <Card className="dashboard-funnel flex flex-col gap-4">
      <CardHeader
        title="Layer funnel"
        subtitle="Unsold parcels move down a layer: light bar = reached the layer, dark bar = sold there. Click a layer to filter the breakdowns below."
      />

      <div className="flex flex-col gap-1">
        <FunnelRow label="Returns" bar={<Bar value={f.returns} total={total} color={LAYER_FILL[1]} faint />} count={f.returns} />

        {f.stages.map((s) => (
          <FunnelRow
            key={s.layer}
            label={LAYER_LABEL[s.layer]}
            active={layerFilter === s.layer}
            onClick={() => toggle(s.layer)}
            title={`${s.sold} sold of ${s.reached} that reached ${LAYER_LABEL[s.layer]}`}
            bar={
              <>
                <Bar value={s.reached} total={total} color={LAYER_FILL[s.layer]} faint />
                <Bar value={s.sold} total={total} color={LAYER_FILL[s.layer]} />
              </>
            }
            count={
              <>
                <b className="font-display text-header-purple">{s.sold}</b> sold{' '}
                <span className="text-header-purple/50">/ {s.reached}</span>
              </>
            }
          />
        ))}

        <FunnelRow
          label="Unsold"
          active={layerFilter === 'unsold'}
          onClick={() => toggle('unsold')}
          bar={<Bar value={f.unsold} total={total} color={LAYER_FILL.unsold} />}
          count={f.unsold}
        />
      </div>

      {layerFilter && (
        <Button variant="ghost" size="sm" className="self-start !px-0" onClick={() => onLayerFilterChange(undefined)}>
          Showing {layerFilter === 'unsold' ? 'unsold returns' : LAYER_LABEL[layerFilter] + ' resales'} · clear filter
        </Button>
      )}
    </Card>
  )
}

/** One funnel line: label, bar track, count. A button when it filters, static otherwise. */
function FunnelRow({
  label,
  bar,
  count,
  active,
  onClick,
  title,
}: {
  label: string
  bar: React.ReactNode
  count: React.ReactNode
  active?: boolean
  onClick?: () => void
  title?: string
}) {
  const content = (
    <>
      <span className="w-16 shrink-0 font-semibold text-header-purple">{label}</span>
      <div className="relative flex-1 h-3 rounded-full bg-header-purple/10">{bar}</div>
      <span className="w-28 shrink-0 text-right text-header-purple">{count}</span>
    </>
  )
  const row = cx('funnel-row text-body text-left transition-colors')

  if (!onClick) return <div className={row}>{content}</div>
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cx(row, active ? 'bg-light-orange' : 'hover:bg-bg-beige/60')}
    >
      {content}
    </button>
  )
}

/** A bar inside the track, as a share of all returns. `faint` draws the lighter "reached" version. */
function Bar({ value, total, color, faint }: { value: number; total: number; color: string; faint?: boolean }) {
  return (
    <div
      className="chart-bar absolute inset-y-0 left-0 rounded-full"
      style={{ width: `${(value / total) * 100}%`, background: color, opacity: faint ? 0.2 : 1 }}
    />
  )
}
