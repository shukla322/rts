// Pure selectors over the list of RunRecords. Every number the Dashboard,
// KPI strip, node popup and Sellers tab shows is derived here.
import { BOOST_REASON_ORDER } from '../engine/boostReasons'
import { CATEGORIES } from './catalog'
import { NODE_ORDERS_HANDLED } from './demand'
import { MAJOR_NODES, majorIdOfNode, type MajorNodeId } from './network'
import type { BoostReason, CategoryId, Layer, RunRecord } from './types'

export type LayerFilter = Layer | 'unsold'

export interface RunFilter {
  layer?: LayerFilter
  categoryId?: CategoryId
  sellerId?: string
}

const LAYERS: Layer[] = [1, 2, 3]

export function filterRuns(runs: RunRecord[], filter: RunFilter = {}): RunRecord[] {
  return runs.filter((r) => {
    if (filter.categoryId && r.categoryId !== filter.categoryId) return false
    if (filter.sellerId && r.sellerId !== filter.sellerId) return false
    if (filter.layer === 'unsold') return r.outcome === 'unsold'
    if (filter.layer && r.soldLayer !== filter.layer) return false
    return true
  })
}

function sum(runs: RunRecord[], pick: (r: RunRecord) => number): number {
  return runs.reduce((total, r) => total + pick(r), 0)
}

function average(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length
}

// ---- KPIs ----

export interface LayerConversion {
  reached: number
  sold: number
  rate: number
}

export interface Kpis {
  returns: number
  sold: number
  resoldPct: number
  kmBaseline: number
  kmActual: number
  kmAvoided: number
  costBaseline: number
  costActual: number
  costSaved: number
  avgTimeToResaleDays: number | null
  avgDiscountPct: number | null
  revenueRecovered: number
  conversionByLayer: Record<Layer, LayerConversion>
}

export function kpis(runs: RunRecord[], filter: RunFilter = {}): Kpis {
  const rs = filterRuns(runs, filter)
  const soldRuns = rs.filter((r) => r.outcome === 'sold')
  const conversionByLayer = Object.fromEntries(
    LAYERS.map((layer) => {
      const reached = rs.filter((r) => r.outcome === 'unsold' || r.soldLayer! >= layer).length
      const sold = rs.filter((r) => r.soldLayer === layer).length
      return [layer, { reached, sold, rate: reached === 0 ? 0 : sold / reached }]
    }),
  ) as Record<Layer, LayerConversion>

  return {
    returns: rs.length,
    sold: soldRuns.length,
    resoldPct: rs.length === 0 ? 0 : soldRuns.length / rs.length,
    kmBaseline: sum(rs, (r) => r.baseline.km),
    kmActual: sum(rs, (r) => r.actual.km),
    kmAvoided: sum(rs, (r) => r.avoided.km),
    costBaseline: sum(rs, (r) => r.baseline.cost),
    costActual: sum(rs, (r) => r.actual.cost),
    costSaved: sum(rs, (r) => r.avoided.cost),
    avgTimeToResaleDays: average(soldRuns.map((r) => r.timeToResaleDays!)),
    avgDiscountPct: average(soldRuns.map((r) => r.discountPct ?? 0)),
    revenueRecovered: sum(soldRuns, (r) => r.pricePaid ?? 0),
    conversionByLayer,
  }
}

// ---- Funnel ----

export interface FunnelStage {
  layer: Layer
  reached: number
  sold: number
}

export interface Funnel {
  returns: number
  stages: FunnelStage[]
  unsold: number
}

export function funnel(runs: RunRecord[]): Funnel {
  return {
    returns: runs.length,
    stages: LAYERS.map((layer) => ({
      layer,
      reached: runs.filter((r) => r.outcome === 'unsold' || r.soldLayer! >= layer).length,
      sold: runs.filter((r) => r.soldLayer === layer).length,
    })),
    unsold: runs.filter((r) => r.outcome === 'unsold').length,
  }
}

// ---- Breakdowns ----

export interface OutcomeBreakdownRow {
  id: string
  name: string
  returns: number
  sold: number
  resoldPct: number
  soldByLayer: Record<Layer, number>
  unsold: number
}

function outcomeRow(id: string, name: string, rs: RunRecord[]): OutcomeBreakdownRow {
  const sold = rs.filter((r) => r.outcome === 'sold').length
  return {
    id,
    name,
    returns: rs.length,
    sold,
    resoldPct: rs.length === 0 ? 0 : sold / rs.length,
    soldByLayer: {
      1: rs.filter((r) => r.soldLayer === 1).length,
      2: rs.filter((r) => r.soldLayer === 2).length,
      3: rs.filter((r) => r.soldLayer === 3).length,
    },
    unsold: rs.length - sold,
  }
}

export function byCategory(runs: RunRecord[]): OutcomeBreakdownRow[] {
  return CATEGORIES.map((c) =>
    outcomeRow(c.id, c.name, runs.filter((r) => r.categoryId === c.id)),
  )
}

/** Returns grouped by destination node (the region where the return lands). */
export function byNode(runs: RunRecord[]): OutcomeBreakdownRow[] {
  return MAJOR_NODES.map((n) => outcomeRow(n.id, n.city, runs.filter((r) => r.dscId === n.id)))
}

export function bySeller(
  runs: RunRecord[],
  sellers: { id: string; name: string }[],
): OutcomeBreakdownRow[] {
  return sellers.map((s) => outcomeRow(s.id, s.name, runs.filter((r) => r.sellerId === s.id)))
}

export interface BoostReasonRow {
  reason: BoostReason
  count: number
  share: number
}

/** Share of Layer 2 resales won via each primary boost reason (optionally one category). */
export function byBoostReason(runs: RunRecord[], categoryId?: CategoryId): { rows: BoostReasonRow[]; total: number } {
  const l2 = runs.filter(
    (r) => r.soldLayer === 2 && r.boostReason && (!categoryId || r.categoryId === categoryId),
  )
  return {
    total: l2.length,
    rows: BOOST_REASON_ORDER.map((reason) => {
      const count = l2.filter((r) => r.boostReason === reason).length
      return { reason, count, share: l2.length === 0 ? 0 : count / l2.length }
    }),
  }
}

// ---- Node and seller stats ----

export interface NodeStats {
  ordersHandled: number
  /** Returns whose parcel entered the network at this node (it is the DSC). */
  inboundRtos: number
  /** Returns routed back toward a seller served by this node (it is the SSC). */
  outboundRtos: number
  /** Parcels resold at this node or at one of its last-mile hubs. */
  resoldHere: number
  /** Share of returns entering here that were resold (anywhere). */
  conversionPct: number
  avgDiscountPct: number | null
  recent: RunRecord[]
}

export function nodeStats(runs: RunRecord[], nodeId: MajorNodeId): NodeStats {
  const inbound = runs.filter((r) => r.dscId === nodeId)
  const soldHere = runs.filter((r) => r.soldNodeId && majorIdOfNode(r.soldNodeId) === nodeId)
  const touching = runs
    .filter((r) => r.dscId === nodeId || r.sscId === nodeId || (r.soldNodeId && majorIdOfNode(r.soldNodeId) === nodeId))
    .sort((a, b) => b.createdAt - a.createdAt)
  return {
    ordersHandled: NODE_ORDERS_HANDLED[nodeId],
    inboundRtos: inbound.length,
    outboundRtos: runs.filter((r) => r.sscId === nodeId).length,
    resoldHere: soldHere.length,
    conversionPct: inbound.length === 0 ? 0 : inbound.filter((r) => r.outcome === 'sold').length / inbound.length,
    avgDiscountPct: average(soldHere.map((r) => r.discountPct ?? 0)),
    recent: touching.slice(0, 5),
  }
}

export interface SellerStats {
  returnsHandled: number
  sold: number
  resaleRate: number
  avgDiscountPct: number | null
}

export function sellerStats(runs: RunRecord[], sellerId: string): SellerStats {
  const rs = runs.filter((r) => r.sellerId === sellerId)
  const soldRuns = rs.filter((r) => r.outcome === 'sold')
  return {
    returnsHandled: rs.length,
    sold: soldRuns.length,
    resaleRate: rs.length === 0 ? 0 : soldRuns.length / rs.length,
    avgDiscountPct: average(soldRuns.map((r) => r.discountPct ?? 0)),
  }
}
