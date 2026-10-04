import { useMemo } from 'react'
import { CATEGORIES, getCategory, getProduct } from '../data/catalog'
import { NODE_DEMAND } from '../data/demand'
import { getMajorNode, type MajorNodeId } from '../data/network'
import { nodeStats } from '../data/selectors'
import { useRunStore } from '../state/runStore'
import type { Phase } from '../state/useSimulation'
import { inr, pct, relativeTime } from '../utils/format'
import { Button, Eyebrow, Modal, Notice, Stat } from './ui'

interface Props {
  nodeId: MajorNodeId
  phase: Phase
  sscId: MajorNodeId | null
  onClose: () => void
  onUseAsSource: (id: MajorNodeId) => void
  onUseAsDestination: (id: MajorNodeId) => void
}

/** Stats popup for a major node. Stats come from the run store, so they move as live runs are added. */
export default function NodePopup({ nodeId, phase, sscId, onClose, onUseAsSource, onUseAsDestination }: Props) {
  const { runs } = useRunStore()
  const node = getMajorNode(nodeId)
  const stats = useMemo(() => nodeStats(runs, nodeId), [runs, nodeId])
  const demand = NODE_DEMAND[nodeId]

  return (
    <Modal label={`${node.city} sort centre`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Sort centre</Eyebrow>
            <h2 className="font-display font-extrabold text-xl text-header-purple leading-tight">{node.city}</h2>
          </div>
          <Button variant="outline" size="sm" aria-label="Close" onClick={onClose}>
            ✕
          </Button>
        </div>

        {phase === 'select-ssc' && (
          <Button size="lg" full onClick={() => onUseAsSource(nodeId)}>
            Use as source
          </Button>
        )}
        {phase === 'select-dsc' &&
          (nodeId !== sscId ? (
            <Button size="lg" full onClick={() => onUseAsDestination(nodeId)}>
              Use as destination
            </Button>
          ) : (
            <Notice tone="info">This is already your source. Pick a different node as the destination.</Notice>
          ))}

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Orders handled" value={stats.ordersHandled.toLocaleString('en-IN')} hint="lifetime" />
          <Stat label="Resale conversion" value={pct(stats.conversionPct)} hint="of returns landing here" />
          <Stat label="Inbound RTOs" value={String(stats.inboundRtos)} hint="returns that landed here" />
          <Stat label="Outbound RTOs" value={String(stats.outboundRtos)} hint="returns heading to sellers here" />
          <Stat label="Resold here" value={String(stats.resoldHere)} hint="at this node or its hubs" />
          <Stat
            label="Avg discount given"
            value={stats.avgDiscountPct === null ? '—' : pct(stats.avgDiscountPct, 1)}
            hint="on parcels sold here"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Eyebrow>Demand profile</Eyebrow>
          <p className="text-body text-header-purple/70">
            Regional order density <b className="text-header-purple">{pct(demand.regionOrderDensity)}</b>
          </p>
          <table className="w-full text-body text-header-purple">
            <thead>
              <tr className="text-left text-caption uppercase tracking-wider text-header-purple/60">
                <th className="py-1 font-extrabold">Category</th>
                <th className="py-1 font-extrabold text-right">Cart overlap</th>
                <th className="py-1 font-extrabold text-right">Order freq.</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => {
                const d = demand.byCategory[c.id]
                return (
                  <tr key={c.id} className="border-t border-header-purple/10">
                    <td className="py-1 font-semibold">{c.name}</td>
                    <td className="py-1 text-right tabular-nums">{pct(d.cartOverlap)}</td>
                    <td className="py-1 text-right tabular-nums">{pct(d.orderFrequency)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-1">
          <Eyebrow>Recent runs touching this node</Eyebrow>
          {stats.recent.length === 0 ? (
            <p className="text-body text-header-purple/60">None yet.</p>
          ) : (
            <ul className="flex flex-col">
              {stats.recent.map((r) => (
                <li key={r.id} className="border-t border-header-purple/10 py-1.5 text-body leading-snug">
                  <span className="font-semibold text-header-purple">
                    {getProduct(r.productId).name}{' '}
                    <span className="font-normal text-header-purple/60">({getCategory(r.categoryId).name})</span>
                  </span>
                  <br />
                  <span className="text-header-purple/70">
                    {getMajorNode(r.sscId as MajorNodeId).city} → {getMajorNode(r.dscId as MajorNodeId).city} ·{' '}
                    {r.outcome === 'sold' ? `sold L${r.soldLayer}${r.pricePaid ? ` for ${inr(r.pricePaid)}` : ''}` : 'unsold'} ·{' '}
                    {relativeTime(r.createdAt)}
                    {r.source === 'live' ? ' · your run' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
