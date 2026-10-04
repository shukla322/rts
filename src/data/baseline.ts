import { haversineKm } from './geo'
import { getLmdhsForMajor, getMajorNode, getNetworkPath, type MajorNodeId } from './network'
import type { Layer, RouteMetrics } from './types'

/** Legs, km and cost of walking a chain of major nodes. */
export function pathMetrics(ids: MajorNodeId[], costPerLeg: number): RouteMetrics {
  let km = 0
  for (let i = 1; i < ids.length; i++) {
    km += haversineKm(getMajorNode(ids[i - 1]), getMajorNode(ids[i]))
  }
  const legs = Math.max(0, ids.length - 1)
  return { legs, km, cost: legs * costPerLeg }
}

/** Baseline: the parcel travels the full network path back to the seller. */
export function computeBaseline(sscId: MajorNodeId, dscId: MajorNodeId, costPerLeg: number): RouteMetrics {
  return pathMetrics(getNetworkPath(sscId, dscId), costPerLeg)
}

/** Actual (Return-to-Sale) metrics given where, if anywhere, the parcel sold. */
export function computeActual(
  sscId: MajorNodeId,
  dscId: MajorNodeId,
  costPerLeg: number,
  soldLayer: Layer | undefined,
  soldNodeId: string | undefined,
): RouteMetrics {
  if (!soldLayer || !soldNodeId) return computeBaseline(sscId, dscId, costPerLeg)

  const dsc = getMajorNode(dscId)
  if (soldLayer === 1) {
    const hub = getLmdhsForMajor(dscId).magenta.find((n) => n.id === soldNodeId)
    return { legs: 0, km: hub ? haversineKm(dsc, hub) : 0, cost: 0 }
  }
  if (soldLayer === 2) {
    return { legs: 1, km: haversineKm(dsc, getMajorNode(soldNodeId as MajorNodeId)), cost: costPerLeg }
  }
  // Layer 3: legs/km walked along the DSC -> SSC path up to the buying hop.
  const path = getNetworkPath(dscId, sscId)
  const index = path.indexOf(soldNodeId as MajorNodeId)
  return pathMetrics(path.slice(0, index < 0 ? path.length : index + 1), costPerLeg)
}

export function subtractMetrics(a: RouteMetrics, b: RouteMetrics): RouteMetrics {
  return { legs: a.legs - b.legs, km: a.km - b.km, cost: a.cost - b.cost }
}
