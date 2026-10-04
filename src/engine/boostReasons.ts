import {
  BOOST_REASON_SCORE,
  EXTRA_REASON_BONUS,
  PRIORITY_DISTANCE_DECAY_KM,
  T_CART,
  T_FREQ,
  T_HIGH,
  T_LOW,
  W_PRIORITY_DISTANCE,
  W_PRIORITY_REASON,
} from '../data/assumptions'
import { NODE_DEMAND } from '../data/demand'
import { haversineKm } from '../data/geo'
import { getMajorNode, qualifyingLayer2Majors, type MajorNodeId } from '../data/network'
import type { BoostReason, CategoryId } from '../data/types'

export interface BoostReasonMeta {
  label: string
  /** Short tag for map markers and compact badges. */
  short: string
  /** One-line meaning, shown in the legend. */
  description: string
  /** Badge / zone fill colour and its text colour. */
  bg: string
  fg: string
  /** Darker edge colour for the Layer 2 auction-zone circle. */
  stroke: string
}

// One hue per reason, in priority order: Cart > Frequency > Density > Sparse.
// The same colour is used for the badge, the legend and the auction-zone circle.
// Red is avoided on purpose (it already means refused / unsold).
export const BOOST_REASON_META: Record<BoostReason, BoostReasonMeta> = {
  CART_OVERLAP: {
    label: 'Cart overlap',
    short: 'CART',
    description: 'Buyers here already have this type of product in their carts',
    bg: '#d6409f', // magenta: the strongest, most direct buying signal
    fg: '#fffdf8',
    stroke: '#a5207a',
  },
  HIGH_ORDER_FREQUENCY: {
    label: 'High order frequency',
    short: 'FREQ',
    description: 'This category is ordered often here',
    bg: '#fd9b08', // orange: warm, proven repeat demand
    fg: '#783965',
    stroke: '#c97e1e',
  },
  HIGH_DENSITY: {
    label: 'High density',
    short: 'DENSE',
    description: 'Plentiful buyers, so the parcel sells fast',
    bg: '#2f9e93', // teal: cooler, a volume-driven signal
    fg: '#fffdf8',
    stroke: '#1f7a70',
  },
  LOW_DENSITY: {
    label: 'Low density',
    short: 'SPARSE',
    description: 'Little local competition, so the parcel is valuable to nearby buyers',
    bg: '#5b6fd6', // blue: coolest, a niche / low-competition signal
    fg: '#fffdf8',
    stroke: '#3e4fb0',
  },
  NEARER_TO_BUYER: {
    label: 'Nearer to buyer',
    short: 'NEAR',
    description: 'Qualifies on geography only; no demand signal fired',
    bg: '#cfc4b0', // neutral: no demand signal
    fg: '#783965',
    stroke: '#9a8f7a',
  },
}

export const BOOST_REASON_ORDER: BoostReason[] = [
  'CART_OVERLAP',
  'HIGH_ORDER_FREQUENCY',
  'HIGH_DENSITY',
  'LOW_DENSITY',
  'NEARER_TO_BUYER',
]

export interface BoostReasons {
  /** Every reason that fires (or just NEARER_TO_BUYER when none do). */
  reasons: BoostReason[]
  /** The winner by priority a > b > c > d > fallback. */
  primary: BoostReason
}

export function getBoostReasons(nodeId: MajorNodeId, categoryId: CategoryId): BoostReasons {
  const profile = NODE_DEMAND[nodeId]
  const { cartOverlap, orderFrequency } = profile.byCategory[categoryId]
  const reasons: BoostReason[] = []
  if (cartOverlap >= T_CART) reasons.push('CART_OVERLAP')
  if (orderFrequency >= T_FREQ) reasons.push('HIGH_ORDER_FREQUENCY')
  if (profile.regionOrderDensity >= T_HIGH) reasons.push('HIGH_DENSITY')
  if (profile.regionOrderDensity <= T_LOW) reasons.push('LOW_DENSITY')
  if (reasons.length === 0) reasons.push('NEARER_TO_BUYER')
  return { reasons, primary: reasons[0] }
}

export interface Layer2Bidder {
  id: MajorNodeId
  city: string
  reasons: BoostReason[]
  primary: BoostReason
  kmToParcel: number
  kmToSeller: number
  /** Likelihood-to-buy score in [0, 1] from boost reason and distance (see assumptions.ts). */
  priority: number
}

/**
 * Priority score: how likely this bidder is to buy, from (1) its distance /
 * travel cost from the parcel and (2) its boost reason.
 */
export function getBidderPriority(kmToParcel: number, reasons: BoostReason[]): number {
  const proximity = Math.exp(-kmToParcel / PRIORITY_DISTANCE_DECAY_KM)
  const reasonScore = Math.min(
    1,
    BOOST_REASON_SCORE[reasons[0]] + EXTRA_REASON_BONUS * (reasons.length - 1),
  )
  return W_PRIORITY_DISTANCE * proximity + W_PRIORITY_REASON * reasonScore
}

/**
 * Layer 2 qualifiers for a route in a fixed (network) order, each annotated
 * with its boost reason(s) and priority. The seeded-history model depends on
 * this order, so it is not sorted here.
 */
export function getLayer2Bidders(sscId: MajorNodeId, dscId: MajorNodeId, categoryId: CategoryId): Layer2Bidder[] {
  const ssc = getMajorNode(sscId)
  const dsc = getMajorNode(dscId)
  return qualifyingLayer2Majors(sscId, dscId).map((id) => {
    const node = getMajorNode(id)
    const { reasons, primary } = getBoostReasons(id, categoryId)
    const kmToParcel = haversineKm(node, dsc)
    return {
      id,
      city: node.city,
      reasons,
      primary,
      kmToParcel,
      kmToSeller: haversineKm(node, ssc),
      priority: getBidderPriority(kmToParcel, reasons),
    }
  })
}

/** The Layer 2 "priority list": the same bidders, highest likelihood to buy first. */
export function getLayer2PriorityList(
  sscId: MajorNodeId,
  dscId: MajorNodeId,
  categoryId: CategoryId,
): Layer2Bidder[] {
  return getLayer2Bidders(sscId, dscId, categoryId).sort((a, b) => b.priority - a.priority)
}
