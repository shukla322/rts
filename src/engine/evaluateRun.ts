import { computeActual, computeBaseline, subtractMetrics } from '../data/baseline'
import { TIME_TO_RESALE_DAYS } from '../data/assumptions'
import { getSeller } from '../data/sellers'
import { getLmdhsForMajor, getMajorNode, getNetworkPath, type MajorNodeId } from '../data/network'
import { getLayer2Price, effectiveLayer2Discount, getPricingForNode, isLayer2Capped } from '../data/pricing'
import type { Layer, Product, RunRecord, TraceStep } from '../data/types'
import { inr } from '../utils/format'
import { BOOST_REASON_META, getLayer2PriorityList } from './boostReasons'

export interface RunParams {
  id: string
  createdAt: number
  source: 'seeded' | 'live'
  product: Product
  sscId: MajorNodeId
  dscId: MajorNodeId
  costPerLeg: number
  margin: number
}

/** What happened: where (if anywhere) the parcel sold. Everything else is derived. */
export interface RunDecisions {
  soldLayer?: Layer
  soldNodeId?: string
}

/**
 * Pure: build the full RunRecord (baseline / actual / avoided / price / trace)
 * from the run's setup and its outcome. Used for live runs (decisions from the
 * operator) and seeded history (decisions from the buyer-acceptance model).
 */
export function evaluateRun(params: RunParams, decisions: RunDecisions): RunRecord {
  const { product, sscId, dscId, costPerLeg, margin, source } = params
  const seller = getSeller(product.sellerId)
  const cap = seller.contract.resaleDiscountCap
  const capLabel = `${Math.round(cap * 100)}%`
  const config = { totalPrice: product.price, costPerEdge: costPerLeg, margin }
  const ssc = getMajorNode(sscId)
  const dsc = getMajorNode(dscId)

  const sold = decisions.soldLayer !== undefined && decisions.soldNodeId !== undefined
  const soldLayer = sold ? decisions.soldLayer : undefined
  const soldNodeId = sold ? decisions.soldNodeId : undefined
  const reached = (layer: Layer) => soldLayer === undefined || layer <= soldLayer
  // Layer-level pass: live runs are moved on by the operator, seeded ones decline.
  const passEvent = source === 'live' ? 'skipped' : 'declined'

  const trace: TraceStep[] = []
  let pricePaid: number | undefined
  let boostReason: RunRecord['boostReason']

  // ---- Layer 1: adjacent LMDH boosting, full price ----
  const hubs = getLmdhsForMajor(dscId)
  trace.push({
    layer: 1,
    nodeId: dscId,
    event: 'qualified',
    price: product.price,
    note: `${hubs.magenta.length} last-mile hubs around ${dsc.city} bid at full price ${inr(product.price)} (no discount); 1 hub refused to bid.`,
  })
  if (soldLayer === 1) {
    const hub = hubs.magenta.find((h) => h.id === soldNodeId)
    pricePaid = product.price
    trace.push({
      layer: 1,
      nodeId: soldNodeId!,
      event: 'bought',
      price: pricePaid,
      note: `${hub?.city ?? 'A last-mile hub'} bought at ${inr(pricePaid)}. The parcel never leaves ${dsc.city}.`,
    })
  } else {
    trace.push({
      layer: 1,
      nodeId: dscId,
      event: passEvent,
      note: 'No last-mile hub bought; moving on to Layer 2.',
    })
  }

  // ---- Layer 2: nation-wide boosting, flat discount (capped by contract) ----
  if (reached(2)) {
    const bidders = getLayer2PriorityList(sscId, dscId, product.categoryId)
    const l2Price = getLayer2Price(config, cap)
    const l2Discount = effectiveLayer2Discount(cap)
    const capNote = isLayer2Capped(cap)
      ? ` Discount capped at ${capLabel} by ${seller.name}'s contract.`
      : ''
    if (bidders.length === 0) {
      trace.push({
        layer: 2,
        nodeId: dscId,
        event: 'skipped',
        note: 'No sort centre is closer to the parcel than to the seller, so Layer 2 has no bidders.',
      })
    } else {
      for (const [rank, b] of bidders.entries()) {
        const meta = BOOST_REASON_META[b.primary]
        const extra = b.reasons.length > 1
          ? ` Also: ${b.reasons.slice(1).map((r) => BOOST_REASON_META[r].label).join(', ')}.`
          : ''
        trace.push({
          layer: 2,
          nodeId: b.id,
          event: 'qualified',
          reason: b.primary,
          price: l2Price,
          note: `Priority #${rank + 1} (${Math.round(b.priority * 100)}% likelihood): ${b.city} qualifies, ${Math.round(b.kmToParcel)} km from the parcel vs ${Math.round(b.kmToSeller)} km from the seller. Boost: ${meta.label} (${meta.description}).${extra}`,
        })
      }
      if (soldLayer === 2) {
        const winner = bidders.find((b) => b.id === soldNodeId)
        pricePaid = l2Price
        boostReason = winner?.primary
        trace.push({
          layer: 2,
          nodeId: soldNodeId!,
          event: 'bought',
          reason: winner?.primary,
          price: pricePaid,
          note: `${winner?.city ?? soldNodeId} bought at ${inr(pricePaid)} (${Math.round(l2Discount * 100)}% off).${capNote}`,
        })
      } else {
        trace.push({
          layer: 2,
          nodeId: dscId,
          event: passEvent,
          note: `${bidders.length} sort centres bid at ${inr(l2Price)} (${Math.round(l2Discount * 100)}% off); none bought. Moving on to Layer 3.${capNote}`,
        })
      }
    }
  }

  // ---- Layer 3: sequential backup toward the seller ----
  if (reached(3)) {
    const path = getNetworkPath(dscId, sscId)
    const last = path.length - 1
    const soldIndex = soldLayer === 3 ? path.indexOf(soldNodeId as MajorNodeId) : -1
    const stop = soldLayer === 3 && soldIndex > 0 ? soldIndex : last
    for (let i = 1; i <= stop; i++) {
      const hop = getMajorNode(path[i])
      const p = getPricingForNode(i, last, config, cap)
      const capped = p.capped ? ` Discount capped at ${capLabel} by ${seller.name}'s contract.` : ''
      trace.push({
        layer: 3,
        nodeId: hop.id,
        event: 'bid',
        price: p.discountedPrice,
        note: `Hop ${i} of ${last}: ${hop.city} is offered ${inr(p.discountedPrice)} (${p.percentSaved.toFixed(0)}% off, ${p.remainingEdges} ${p.remainingEdges === 1 ? 'leg' : 'legs'} of return transit avoided).${capped}`,
      })
      if (soldLayer === 3 && i === stop) {
        pricePaid = p.discountedPrice
        trace.push({
          layer: 3,
          nodeId: hop.id,
          event: 'bought',
          price: pricePaid,
          note: `${hop.city} bought at ${inr(pricePaid)}.`,
        })
      } else {
        trace.push({ layer: 3, nodeId: hop.id, event: 'declined', note: `${hop.city} declined.` })
      }
    }
    if (soldLayer !== 3) {
      trace.push({
        layer: 3,
        nodeId: sscId,
        event: 'skipped',
        note: `No buyer in any layer. The parcel completes the full return to ${ssc.city}.`,
      })
    }
  }

  const baseline = computeBaseline(sscId, dscId, costPerLeg)
  const actual = computeActual(sscId, dscId, costPerLeg, soldLayer, soldNodeId)

  return {
    id: params.id,
    createdAt: params.createdAt,
    source,
    productId: product.id,
    categoryId: product.categoryId,
    sellerId: product.sellerId,
    sscId,
    dscId,
    outcome: sold ? 'sold' : 'unsold',
    soldLayer,
    soldNodeId,
    listPrice: product.price,
    pricePaid,
    discountPct: pricePaid === undefined ? undefined : (product.price - pricePaid) / product.price,
    boostReason,
    baseline,
    actual,
    avoided: subtractMetrics(baseline, actual),
    timeToResaleDays: soldLayer ? TIME_TO_RESALE_DAYS[soldLayer] : undefined,
    trace,
  }
}
