import type { MajorNodeId } from './network'
import type { CategoryId, NodeDemandProfile } from './types'

// Deterministic, hand-tuned, illustrative demand profiles (not measured data).
// One row per major node: [regionOrderDensity, then (cartOverlap, orderFrequency)
// for audio, sarees, footwear, decor]. Tuned by eye so different categories
// fire different Layer 2 boost reasons for the same destination.
const CATEGORY_ORDER: CategoryId[] = ['audio', 'sarees', 'footwear', 'decor']

type Row = [number, [number, number], [number, number], [number, number], [number, number]]

const TABLE: Record<MajorNodeId, Row> = {
  //        density  audio        sarees       footwear     decor
  GUW: [0.2, [0.35, 0.45], [0.7, 0.55], [0.3, 0.4], [0.25, 0.35]],
  KOL: [0.7, [0.45, 0.65], [0.75, 0.8], [0.4, 0.5], [0.55, 0.45]],
  BBS: [0.35, [0.3, 0.35], [0.65, 0.7], [0.35, 0.3], [0.4, 0.62]],
  CHE: [0.75, [0.55, 0.7], [0.8, 0.75], [0.45, 0.5], [0.5, 0.4]],
  HYD: [0.8, [0.7, 0.75], [0.55, 0.65], [0.4, 0.45], [0.45, 0.5]],
  BLR: [0.85, [0.8, 0.85], [0.5, 0.55], [0.55, 0.6], [0.62, 0.55]],
  TRV: [0.25, [0.4, 0.3], [0.6, 0.5], [0.25, 0.35], [0.35, 0.45]],
  BOM: [0.9, [0.75, 0.8], [0.45, 0.4], [0.65, 0.7], [0.6, 0.65]],
  PUN: [0.7, [0.65, 0.6], [0.4, 0.45], [0.5, 0.55], [0.7, 0.62]],
  AMD: [0.55, [0.4, 0.5], [0.55, 0.5], [0.72, 0.65], [0.45, 0.4]],
  JAI: [0.4, [0.3, 0.4], [0.55, 0.5], [0.68, 0.55], [0.78, 0.72]],
  DEL: [0.85, [0.72, 0.78], [0.5, 0.6], [0.78, 0.72], [0.55, 0.5]],
  BHO: [0.35, [0.25, 0.3], [0.45, 0.4], [0.4, 0.35], [0.5, 0.45]],
  DEH: [0.15, [0.3, 0.25], [0.35, 0.3], [0.55, 0.62], [0.3, 0.25]],
}

export const NODE_DEMAND: Record<MajorNodeId, NodeDemandProfile> = Object.fromEntries(
  (Object.keys(TABLE) as MajorNodeId[]).map((id) => {
    const [density, ...cats] = TABLE[id]
    const byCategory = Object.fromEntries(
      CATEGORY_ORDER.map((cat, i) => [cat, { cartOverlap: cats[i][0], orderFrequency: cats[i][1] }]),
    ) as NodeDemandProfile['byCategory']
    return [id, { regionOrderDensity: density, byCategory }]
  }),
) as Record<MajorNodeId, NodeDemandProfile>

/** Static, illustrative lifetime order counts per major node (from the seed). */
export const NODE_ORDERS_HANDLED: Record<MajorNodeId, number> = {
  GUW: 18400,
  KOL: 52300,
  BBS: 21700,
  CHE: 61800,
  HYD: 68400,
  BLR: 79200,
  TRV: 17900,
  BOM: 91500,
  PUN: 54600,
  AMD: 43100,
  JAI: 30800,
  DEL: 86700,
  BHO: 24500,
  DEH: 9800,
}

export function getDemand(nodeId: MajorNodeId): NodeDemandProfile {
  return NODE_DEMAND[nodeId]
}
