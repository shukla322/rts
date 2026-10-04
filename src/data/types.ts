export type CategoryId = 'audio' | 'sarees' | 'footwear' | 'decor'

export interface Category {
  id: CategoryId
  name: string
}

export interface Product {
  id: string
  name: string
  categoryId: CategoryId
  /** INR, illustrative. Replaces the old Product Price slider. */
  price: number
  sellerId: string
  image: string
}

export interface Seller {
  id: string
  name: string // fictional names only
  rating: number // synthetic
  reviewCount: number // synthetic
  rtoRate: number // synthetic, 0..1
  returnReasonMix: Record<string, number> // synthetic, sums to 1
  reviews: { stars: number; text: string }[] // clearly synthetic
  contract: {
    signedOn: string // ISO date
    termMonths: number
    /** Max discount Valmo may offer on a resale (0..1). */
    resaleDiscountCap: number
    returnWindowDays: number
  }
}

export type BoostReason =
  | 'CART_OVERLAP' // (a) users here already have this type of product in their carts
  | 'HIGH_ORDER_FREQUENCY' // (b) this category is ordered often here
  | 'HIGH_DENSITY' // (c) high order density: plentiful buyers, sells fast
  | 'LOW_DENSITY' // (d) low order density: little local competition, parcel is valuable
  | 'NEARER_TO_BUYER' // fallback: qualifies geographically but no demand signal fired

export interface NodeDemandProfile {
  regionOrderDensity: number // 0..1, one value per node
  byCategory: Record<CategoryId, { cartOverlap: number; orderFrequency: number }> // 0..1
}

export type Layer = 1 | 2 | 3

export interface TraceStep {
  layer: Layer
  nodeId: string
  event: 'qualified' | 'bid' | 'declined' | 'bought' | 'skipped'
  reason?: BoostReason // Layer 2 only
  price?: number
  note: string // human-readable, shown in the UI
}

export interface RouteMetrics {
  legs: number
  km: number
  cost: number
}

export interface RunRecord {
  id: string
  createdAt: number
  source: 'seeded' | 'live'
  productId: string
  categoryId: CategoryId
  sellerId: string
  sscId: string
  dscId: string
  outcome: 'sold' | 'unsold'
  soldLayer?: Layer
  soldNodeId?: string
  listPrice: number
  pricePaid?: number
  discountPct?: number
  boostReason?: BoostReason // set when sold in Layer 2
  baseline: RouteMetrics
  actual: RouteMetrics
  avoided: RouteMetrics // baseline - actual
  timeToResaleDays?: number
  trace: TraceStep[]
}
