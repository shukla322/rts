import type { ZoneColor } from './nodes'

export const DEFAULT_TOTAL_PRICE = 269
export const DEFAULT_COST_PER_EDGE = 30
export const DEFAULT_MARGIN = 0.6

export const TOTAL_PRICE_RANGE = { min: 100, max: 1000, step: 1 }
export const COST_PER_EDGE_RANGE = { min: 10, max: 50, step: 1 }
export const MARGIN_RANGE = { min: 0, max: 1, step: 0.05 }

export interface PricingConfig {
  totalPrice: number
  costPerEdge: number
  margin: number
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  totalPrice: DEFAULT_TOTAL_PRICE,
  costPerEdge: DEFAULT_COST_PER_EDGE,
  margin: DEFAULT_MARGIN,
}

// Position 1..4 within any 5-city route (0 is always LMDH, never auctioned).
export const ZONE_COLORS_BY_POSITION: ZoneColor[] = ['green', 'yellow', 'orange', 'red']

export interface PricingBreakdown {
  remainingEdges: number
  avoidedTravelCost: number
  discount: number
  discountedPrice: number
  percentSaved: number
  /** Net reverse-logistics cost kept by the operator: the avoided cost minus
   * the margin fraction handed back to the buyer as their discount. */
  operatorSavings: number
  /** operatorSavings as a % of the full route's total travel cost
   * (all edges × cost per leg), not just the avoided/remaining portion. */
  operatorSavingsPercent: number
}

export function getPricingForNode(
  nodeIndex: number,
  lastIndex: number,
  config: PricingConfig,
): PricingBreakdown {
  const remainingEdges = lastIndex - nodeIndex
  const avoidedTravelCost = remainingEdges * config.costPerEdge
  const discount = config.margin * avoidedTravelCost
  const discountedPrice = config.totalPrice - discount
  const percentSaved = (discount / config.totalPrice) * 100
  const totalTravelCost = lastIndex * config.costPerEdge
  const operatorSavings = (1 - config.margin) * avoidedTravelCost
  const operatorSavingsPercent = (operatorSavings / totalTravelCost) * 100
  return {
    remainingEdges,
    avoidedTravelCost,
    discount,
    discountedPrice,
    percentSaved,
    operatorSavings,
    operatorSavingsPercent,
  }
}

export function getZoneColorForNode(nodeIndex: number): ZoneColor {
  return ZONE_COLORS_BY_POSITION[nodeIndex - 1]
}
