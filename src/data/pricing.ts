import type { ZoneColor } from './nodes'
import { DEFAULT_COST_PER_LEG, DEFAULT_MARGIN, LAYER2_DISCOUNT } from './assumptions'

export { LAYER2_DISCOUNT }

export const COST_PER_EDGE_RANGE = { min: 10, max: 50, step: 1 }
export const MARGIN_RANGE = { min: 0, max: 1, step: 0.05 }

export interface PricingConfig {
  /** The selected product's price (no longer a slider). */
  totalPrice: number
  costPerEdge: number
  margin: number
}

export const DEFAULT_PRICING_SLIDERS = {
  costPerEdge: DEFAULT_COST_PER_LEG,
  margin: DEFAULT_MARGIN,
}

// Position 1..4 within a layer-3 chain (0 is always the DSC, never auctioned
// there directly — layer 3 starts at position 1, same as the old pipeline).
export const ZONE_COLORS_BY_POSITION: ZoneColor[] = ['green', 'yellow', 'orange', 'red']

// Layer 2 ("nation-wide boosting"): flat discount, limited by the seller's
// contract cap.
export function effectiveLayer2Discount(discountCap: number): number {
  return Math.min(LAYER2_DISCOUNT, discountCap)
}

export function isLayer2Capped(discountCap: number): boolean {
  return discountCap < LAYER2_DISCOUNT
}

export function getLayer2Price(config: PricingConfig, discountCap: number): number {
  return config.totalPrice * (1 - effectiveLayer2Discount(discountCap))
}

export interface PricingBreakdown {
  remainingEdges: number
  avoidedTravelCost: number
  /** Discount actually given, in INR (already limited by the seller cap). */
  discount: number
  discountedPrice: number
  percentSaved: number
  /** True when the seller's contract cap clamped the formula discount. */
  capped: boolean
  /** Net reverse-logistics cost kept by the operator: the avoided cost minus
   * the discount handed back to the buyer. */
  operatorSavings: number
  /** operatorSavings as a % of the full route's total travel cost
   * (all edges × cost per leg), not just the avoided/remaining portion. */
  operatorSavingsPercent: number
}

export function getPricingForNode(
  nodeIndex: number,
  lastIndex: number,
  config: PricingConfig,
  discountCap = 1,
): PricingBreakdown {
  const remainingEdges = lastIndex - nodeIndex
  const avoidedTravelCost = remainingEdges * config.costPerEdge
  const formulaDiscount = config.margin * avoidedTravelCost
  const maxDiscount = discountCap * config.totalPrice
  const capped = formulaDiscount > maxDiscount
  const discount = capped ? maxDiscount : formulaDiscount
  const discountedPrice = config.totalPrice - discount
  const percentSaved = (discount / config.totalPrice) * 100
  const totalTravelCost = lastIndex * config.costPerEdge
  const operatorSavings = avoidedTravelCost - discount
  const operatorSavingsPercent = totalTravelCost > 0 ? (operatorSavings / totalTravelCost) * 100 : 0
  return {
    remainingEdges,
    avoidedTravelCost,
    discount,
    discountedPrice,
    percentSaved,
    capped,
    operatorSavings,
    operatorSavingsPercent,
  }
}

export function getZoneColorForNode(nodeIndex: number): ZoneColor {
  return ZONE_COLORS_BY_POSITION[nodeIndex - 1]
}
