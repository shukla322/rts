import {
  BUY_BASE_RATE,
  DEFAULT_COST_PER_LEG,
  DEFAULT_MARGIN,
  DISCOUNT_ELASTICITY,
  HISTORY_WINDOW_DAYS,
  MAX_BUY_PROBABILITY,
  SCORE_OFFSET,
  W_CART,
  W_DENSITY,
  W_FREQ,
} from '../data/assumptions'
import { PRODUCTS } from '../data/catalog'
import { NODE_DEMAND } from '../data/demand'
import { getSeller } from '../data/sellers'
import { getLmdhsForMajor, getNetworkPath, MAJOR_NODES, type MajorNodeId } from '../data/network'
import { effectiveLayer2Discount, getPricingForNode } from '../data/pricing'
import type { CategoryId, Layer, RunRecord } from '../data/types'
import { mulberry32, pickOne, pickWeighted, type Rng } from '../utils/rng'
import { getLayer2Bidders } from './boostReasons'
import { evaluateRun, type RunDecisions } from './evaluateRun'

const DAY_MS = 24 * 60 * 60 * 1000

/** Buyer-acceptance model: chance that one node buys, from its demand profile. */
export function buyProbability(
  layer: Layer,
  nodeId: MajorNodeId,
  categoryId: CategoryId,
  discountPct: number,
): number {
  const profile = NODE_DEMAND[nodeId]
  const { cartOverlap, orderFrequency } = profile.byCategory[categoryId]
  const score = W_CART * cartOverlap + W_FREQ * orderFrequency + W_DENSITY * profile.regionOrderDensity
  const p = BUY_BASE_RATE[layer] * (SCORE_OFFSET + score) * (1 + DISCOUNT_ELASTICITY * discountPct)
  return Math.min(MAX_BUY_PROBABILITY, Math.max(0, p))
}

/** Plays a return through the three layers with simulated buyers instead of an operator. */
function simulateBuyers(
  rng: Rng,
  productId: string,
  sscId: MajorNodeId,
  dscId: MajorNodeId,
): RunDecisions {
  const product = PRODUCTS.find((p) => p.id === productId)!
  const cap = getSeller(product.sellerId).contract.resaleDiscountCap
  const config = { totalPrice: product.price, costPerEdge: DEFAULT_COST_PER_LEG, margin: DEFAULT_MARGIN }

  // Layer 1: four hubs near the DSC, full price, DSC demand profile.
  const p1 = buyProbability(1, dscId, product.categoryId, 0)
  for (const hub of getLmdhsForMajor(dscId).magenta) {
    if (rng() < p1) return { soldLayer: 1, soldNodeId: hub.id }
  }

  // Layer 2: every qualifying node bids at once; one of the buyers wins.
  const d2 = effectiveLayer2Discount(cap)
  const buyers = getLayer2Bidders(sscId, dscId, product.categoryId).filter(
    (b) => rng() < buyProbability(2, b.id, product.categoryId, d2),
  )
  if (buyers.length > 0) return { soldLayer: 2, soldNodeId: pickOne(rng, buyers).id }

  // Layer 3: hop by hop back toward the seller, discount growing with distance.
  const path = getNetworkPath(dscId, sscId)
  const last = path.length - 1
  for (let i = 1; i <= last; i++) {
    const pricing = getPricingForNode(i, last, config, cap)
    if (rng() < buyProbability(3, path[i], product.categoryId, pricing.discount / product.price)) {
      return { soldLayer: 3, soldNodeId: path[i] }
    }
  }
  return {}
}

export interface HistorySetup {
  productId: string
  sscId: MajorNodeId
  dscId: MajorNodeId
  /** Age of the return in days (0 = now). */
  ageDays: number
  decisions: RunDecisions
}

/** The random part of history generation: who returned what, where, and who bought it. */
export function generateSetups(seed: number, count: number): HistorySetup[] {
  const rng = mulberry32(seed)
  const setups: HistorySetup[] = []
  for (let i = 0; i < count; i++) {
    // Sellers with higher RTO rates generate more returns.
    const product = pickWeighted(rng, PRODUCTS, (p) => getSeller(p.sellerId).rtoRate)
    const sscId = pickOne(rng, MAJOR_NODES).id
    let dscId = pickOne(rng, MAJOR_NODES).id
    while (dscId === sscId) dscId = pickOne(rng, MAJOR_NODES).id
    const ageDays = rng() * HISTORY_WINDOW_DAYS
    setups.push({ productId: product.id, sscId, dscId, ageDays, decisions: simulateBuyers(rng, product.id, sscId, dscId) })
  }
  return setups
}

/**
 * Deterministic history: same seed -> same records on every load. Timestamps
 * are anchored to `now` (callers pass today's midnight so the times are stable
 * within a day too).
 */
export function generateHistory(seed: number, count: number, now: number): RunRecord[] {
  const records = generateSetups(seed, count).map((setup, i) =>
    evaluateRun(
      {
        id: `seed-${String(i + 1).padStart(3, '0')}`,
        createdAt: Math.round(now - setup.ageDays * DAY_MS),
        source: 'seeded',
        product: PRODUCTS.find((p) => p.id === setup.productId)!,
        sscId: setup.sscId,
        dscId: setup.dscId,
        costPerLeg: DEFAULT_COST_PER_LEG,
        margin: DEFAULT_MARGIN,
      },
      setup.decisions,
    ),
  )
  return records.sort((x, y) => x.createdAt - y.createdAt)
}

export function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
