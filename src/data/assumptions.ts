// Every assumed / illustrative number in the app lives here and is listed in
// the Dashboard's assumptions drawer. There is no real Valmo data: all
// history is synthetic and seeded.
import type { Layer } from './types'

// ---- Seeded history ----
export const HISTORY_SEED = 13673
export const HISTORY_COUNT = 300
export const HISTORY_WINDOW_DAYS = 30

// ---- Pricing ----
export const LAYER2_DISCOUNT = 0.15
export const DEFAULT_COST_PER_LEG = 30
export const DEFAULT_MARGIN = 0.6

// ---- Layer 2 boost reasons ----
export const LAYER2_MODE: 'parallel' | 'waves' = 'parallel' // only 'parallel' is implemented
export const T_CART = 0.6 // CART_OVERLAP fires when cartOverlap >= T_CART
export const T_FREQ = 0.6 // HIGH_ORDER_FREQUENCY fires when orderFrequency >= T_FREQ
export const T_HIGH = 0.7 // HIGH_DENSITY fires when regionOrderDensity >= T_HIGH
export const T_LOW = 0.3 // LOW_DENSITY fires when regionOrderDensity <= T_LOW

// ---- Layer 2 bidder priority list ----
// Bidders are ranked by a likelihood-to-buy score in [0, 1]:
//   priority = W_PRIORITY_DISTANCE * proximity + W_PRIORITY_REASON * reasonScore
//   proximity = exp(-km from the parcel / PRIORITY_DISTANCE_DECAY_KM)   (closer = less travel cost = higher)
//   reasonScore = BOOST_REASON_SCORE[primary reason] + EXTRA_REASON_BONUS per additional reason, capped at 1
export const W_PRIORITY_DISTANCE = 0.4
export const W_PRIORITY_REASON = 0.6
export const PRIORITY_DISTANCE_DECAY_KM = 800
export const EXTRA_REASON_BONUS = 0.05
export const BOOST_REASON_SCORE = {
  CART_OVERLAP: 1,
  HIGH_ORDER_FREQUENCY: 0.8,
  HIGH_DENSITY: 0.6,
  LOW_DENSITY: 0.45,
  NEARER_TO_BUYER: 0.2,
} as const

// ---- Delivery / time to resale (days) ----
export const TIME_TO_RESALE_DAYS: Record<Layer, number> = { 1: 2, 2: 3, 3: 4 }

// ---- Buyer-acceptance model (used only for seeded history) ----
// p(buy) = clamp(BASE_RATE[layer] * (SCORE_OFFSET + demandScore) * (1 + DISCOUNT_ELASTICITY * discountPct))
// demandScore = W_CART*cartOverlap + W_FREQ*orderFrequency + W_DENSITY*regionOrderDensity
// Layer 1 is per last-mile hub (4 hubs, DSC profile); Layer 2 is per qualifying
// major node; Layer 3 is per hop on the way back to the seller.
export const BUY_BASE_RATE: Record<Layer, number> = { 1: 0.068, 2: 0.035, 3: 0.1 }
export const SCORE_OFFSET = 0.5
export const W_CART = 0.45
export const W_FREQ = 0.35
export const W_DENSITY = 0.2
export const DISCOUNT_ELASTICITY = 2.5
export const MAX_BUY_PROBABILITY = 0.95

export interface AssumptionRow {
  group: string
  key: string
  value: string
  note: string
}

export const ASSUMPTION_ROWS: AssumptionRow[] = [
  { group: 'Return history', key: 'HISTORY_SEED', value: String(HISTORY_SEED), note: 'Fixed seed, so the same history is generated on every load' },
  { group: 'Return history', key: 'HISTORY_COUNT', value: String(HISTORY_COUNT), note: 'Number of returns in the history' },
  { group: 'Return history', key: 'HISTORY_WINDOW_DAYS', value: String(HISTORY_WINDOW_DAYS), note: "Returns are spread over this many days (anchored to today's midnight)" },
  { group: 'Pricing', key: 'LAYER2_DISCOUNT', value: `${LAYER2_DISCOUNT * 100}%`, note: 'Flat Layer 2 discount, before the seller contract cap' },
  { group: 'Pricing', key: 'DEFAULT_COST_PER_LEG', value: `₹${DEFAULT_COST_PER_LEG}`, note: 'Reverse-logistics cost per leg (the sidebar slider changes live runs only)' },
  { group: 'Pricing', key: 'DEFAULT_MARGIN', value: String(DEFAULT_MARGIN), note: 'Share of avoided cost handed to the buyer as a Layer 3 discount' },
  { group: 'Layer 2 boost reasons', key: 'LAYER2_MODE', value: LAYER2_MODE, note: 'All qualifying nodes bid at once; priority waves are not implemented' },
  { group: 'Layer 2 boost reasons', key: 'T_CART', value: String(T_CART), note: 'CART_OVERLAP fires at or above this cart overlap' },
  { group: 'Layer 2 boost reasons', key: 'T_FREQ', value: String(T_FREQ), note: 'HIGH_ORDER_FREQUENCY fires at or above this order frequency' },
  { group: 'Layer 2 boost reasons', key: 'T_HIGH', value: String(T_HIGH), note: 'HIGH_DENSITY fires at or above this regional order density' },
  { group: 'Layer 2 boost reasons', key: 'T_LOW', value: String(T_LOW), note: 'LOW_DENSITY fires at or below this regional order density' },
  { group: 'Layer 2 priority list', key: 'W_PRIORITY_REASON / W_PRIORITY_DISTANCE', value: `${W_PRIORITY_REASON} / ${W_PRIORITY_DISTANCE}`, note: "Weights of boost reason and distance in a bidder's priority score" },
  { group: 'Layer 2 priority list', key: 'PRIORITY_DISTANCE_DECAY_KM', value: String(PRIORITY_DISTANCE_DECAY_KM), note: 'Proximity = exp(-km / this); nearer bidders mean less travel cost' },
  { group: 'Layer 2 priority list', key: 'BOOST_REASON_SCORE', value: 'Cart 1 · Freq 0.8 · Density 0.6 · Sparse 0.45 · Near 0.2', note: 'Reason score by primary boost reason' },
  { group: 'Layer 2 priority list', key: 'EXTRA_REASON_BONUS', value: String(EXTRA_REASON_BONUS), note: 'Added per additional boost reason that also fires' },
  { group: 'Time to resale (days)', key: 'TIME_TO_RESALE_DAYS[1]', value: String(TIME_TO_RESALE_DAYS[1]), note: 'Layer 1 — "within 2 days"' },
  { group: 'Time to resale (days)', key: 'TIME_TO_RESALE_DAYS[2]', value: String(TIME_TO_RESALE_DAYS[2]), note: 'Layer 2' },
  { group: 'Time to resale (days)', key: 'TIME_TO_RESALE_DAYS[3]', value: String(TIME_TO_RESALE_DAYS[3]), note: 'Layer 3' },
  { group: 'Buyer-acceptance model', key: 'BUY_BASE_RATE[1]', value: String(BUY_BASE_RATE[1]), note: 'Per last-mile hub' },
  { group: 'Buyer-acceptance model', key: 'BUY_BASE_RATE[2]', value: String(BUY_BASE_RATE[2]), note: 'Per qualifying sort centre' },
  { group: 'Buyer-acceptance model', key: 'BUY_BASE_RATE[3]', value: String(BUY_BASE_RATE[3]), note: 'Per hop' },
  { group: 'Buyer-acceptance model', key: 'SCORE_OFFSET', value: String(SCORE_OFFSET), note: 'Added to the demand score before scaling' },
  { group: 'Buyer-acceptance model', key: 'W_CART / W_FREQ / W_DENSITY', value: `${W_CART} / ${W_FREQ} / ${W_DENSITY}`, note: 'Demand-score weights' },
  { group: 'Buyer-acceptance model', key: 'DISCOUNT_ELASTICITY', value: String(DISCOUNT_ELASTICITY), note: 'Buy probability grows by this × discount fraction' },
  { group: 'Buyer-acceptance model', key: 'MAX_BUY_PROBABILITY', value: String(MAX_BUY_PROBABILITY), note: "Upper clamp on any single node's buy probability" },
]
