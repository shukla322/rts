import type { HubNode } from './nodes'
import { haversineKm } from './geo'

export type MajorNodeId = 'GUW' | 'KOL' | 'BBS' | 'CHE' | 'HYD' | 'BLR' | 'TRV' | 'BOM' | 'PUN' | 'AMD' | 'JAI' | 'DEL' | 'BHO' | 'DEH'

export interface MajorNode {
  id: MajorNodeId
  city: string
  lat: number
  lng: number
}

export const MAJOR_NODES: MajorNode[] = [
  { id: 'GUW', city: 'Guwahati', lat: 26.1445, lng: 91.7362 },
  { id: 'KOL', city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { id: 'BBS', city: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { id: 'CHE', city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { id: 'HYD', city: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { id: 'BLR', city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { id: 'TRV', city: 'Trivandrum', lat: 8.5241, lng: 76.9366 },
  { id: 'BOM', city: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { id: 'PUN', city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { id: 'AMD', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { id: 'JAI', city: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { id: 'DEL', city: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { id: 'BHO', city: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { id: 'DEH', city: 'Dehradun', lat: 30.3165, lng: 78.0322 },
]

export function getMajorNode(id: MajorNodeId): MajorNode {
  const node = MAJOR_NODES.find((n) => n.id === id)
  if (!node) throw new Error(`Unknown major node ${id}`)
  return node
}

export function majorToHubNode(major: MajorNode): HubNode {
  return { id: major.id, name: 'Sort Centre', city: major.city, lat: major.lat, lng: major.lng }
}

// Bidirectional corridors for this simulated hub network, not verified road
// routes. Keep intermediate hubs on their corridors (e.g. BOM-PUN-BLR).
// Connecting every pair directly would always skip intermediate hubs because
// straight-line distance obeys the triangle inequality.
export const NETWORK_LINKS: ReadonlyArray<readonly [MajorNodeId, MajorNodeId]> = [
  ['BOM', 'PUN'], ['BOM', 'AMD'],
  ['PUN', 'BLR'], ['PUN', 'HYD'], ['PUN', 'BHO'],
  ['AMD', 'JAI'], ['AMD', 'BHO'],
  ['JAI', 'DEL'], ['JAI', 'BHO'], ['DEL', 'DEH'], ['DEL', 'BHO'],
  ['BHO', 'HYD'], ['BHO', 'BBS'], ['BHO', 'KOL'],
  ['HYD', 'BLR'], ['HYD', 'CHE'], ['HYD', 'BBS'],
  ['BLR', 'CHE'], ['BLR', 'TRV'], ['CHE', 'TRV'], ['CHE', 'BBS'],
  ['BBS', 'KOL'], ['KOL', 'GUW'],
]

const adjacency = new Map<MajorNodeId, { id: MajorNodeId; km: number }[]>(
  MAJOR_NODES.map((node) => [node.id, []]),
)
for (const [a, b] of NETWORK_LINKS) {
  const km = haversineKm(getMajorNode(a), getMajorNode(b))
  adjacency.get(a)!.push({ id: b, km })
  adjacency.get(b)!.push({ id: a, km })
}

/** Dijkstra: minimize total geographic km, not hop count or region changes. */
export function getNetworkPath(fromId: MajorNodeId, toId: MajorNodeId): MajorNodeId[] {
  getMajorNode(fromId)
  getMajorNode(toId)
  const pending = new Set(MAJOR_NODES.map((node) => node.id))
  const distances = new Map<MajorNodeId, number>([[fromId, 0]])
  const previous = new Map<MajorNodeId, MajorNodeId>()

  while (pending.size > 0) {
    let nearest: MajorNodeId | undefined
    let best = Infinity
    for (const id of pending) {
      const distance = distances.get(id) ?? Infinity
      if (distance < best) {
        nearest = id
        best = distance
      }
    }
    if (nearest === undefined) break
    if (nearest === toId) {
      const path: MajorNodeId[] = [toId]
      while (path[0] !== fromId) path.unshift(previous.get(path[0])!)
      return path
    }
    pending.delete(nearest)
    for (const neighbor of adjacency.get(nearest)!) {
      if (!pending.has(neighbor.id)) continue
      const candidate = best + neighbor.km
      if (candidate < (distances.get(neighbor.id) ?? Infinity)) {
        distances.set(neighbor.id, candidate)
        previous.set(neighbor.id, nearest)
      }
    }
  }
  throw new Error(`No hub route from ${fromId} to ${toId}`)
}

// ---- LMDH minor nodes (fixed radial offsets per major, one red + rest magenta) ----
const LMDH_OFFSETS: { angleDeg: number; radiusDeg: number }[] = [
  { angleDeg: 0, radiusDeg: 0.35 },
  { angleDeg: 72, radiusDeg: 0.45 },
  { angleDeg: 144, radiusDeg: 0.3 },
  { angleDeg: 216, radiusDeg: 0.5 },
  { angleDeg: 288, radiusDeg: 0.4 },
]

// Coastal cities: the default ring would put hubs in the sea, so each gets a
// hand-picked set of land-side offsets (0 deg = east, 90 deg = north) instead.
// Mumbai and Trivandrum face the Arabian Sea, Chennai and Bhubaneswar the Bay
// of Bengal. Index 0 is still the refused hub.
const COASTAL_LMDH_OFFSETS: Partial<Record<MajorNodeId, { angleDeg: number; radiusDeg: number }[]>> = {
  BOM: [
    { angleDeg: 0, radiusDeg: 0.45 },
    { angleDeg: 50, radiusDeg: 0.5 },
    { angleDeg: -45, radiusDeg: 0.5 },
    { angleDeg: 20, radiusDeg: 0.95 },
    { angleDeg: -25, radiusDeg: 0.9 },
  ],
  CHE: [
    { angleDeg: 180, radiusDeg: 0.45 },
    { angleDeg: 125, radiusDeg: 0.6 },
    { angleDeg: 240, radiusDeg: 0.5 },
    { angleDeg: 150, radiusDeg: 0.85 },
    { angleDeg: 210, radiusDeg: 0.85 },
  ],
  BBS: [
    { angleDeg: 90, radiusDeg: 0.5 },
    { angleDeg: 150, radiusDeg: 0.5 },
    { angleDeg: 200, radiusDeg: 0.65 },
    { angleDeg: 175, radiusDeg: 1 },
    { angleDeg: 120, radiusDeg: 0.95 },
  ],
  TRV: [
    { angleDeg: 75, radiusDeg: 0.5 },
    { angleDeg: 15, radiusDeg: 0.5 },
    { angleDeg: 95, radiusDeg: 0.9 },
    { angleDeg: 35, radiusDeg: 0.95 },
    { angleDeg: 0, radiusDeg: 0.9 },
  ],
}

function offsetLatLng(lat: number, lng: number, angleDeg: number, radiusDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  const dLat = radiusDeg * Math.sin(rad)
  const dLng = (radiusDeg * Math.cos(rad)) / Math.cos((lat * Math.PI) / 180)
  return { lat: lat + dLat, lng: lng + dLng }
}

export function getLmdhsForMajor(majorId: MajorNodeId): { red: HubNode; magenta: HubNode[] } {
  const major = getMajorNode(majorId)
  const nodes = (COASTAL_LMDH_OFFSETS[majorId] ?? LMDH_OFFSETS).map((offset, i) => {
    const { lat, lng } = offsetLatLng(major.lat, major.lng, offset.angleDeg, offset.radiusDeg)
    return {
      id: `${majorId}-LMDH-${i}`,
      name: 'Last Mile Delivery Hub',
      city: `${major.city} Hub ${i + 1}`,
      lat,
      lng,
    }
  })
  const [red, ...magenta] = nodes
  return { red, magenta }
}

// ---- Layer 2 qualification: every other major node geographically closer to
// the parcel (DSC) than to the original seller (SSC) bids nation-wide. ----
export function qualifyingLayer2Majors(sscId: MajorNodeId, dscId: MajorNodeId): MajorNodeId[] {
  const dsc = getMajorNode(dscId)
  const ssc = getMajorNode(sscId)
  return MAJOR_NODES.filter(
    (m) => m.id !== sscId && m.id !== dscId && haversineKm(m, dsc) < haversineKm(m, ssc),
  ).map((m) => m.id)
}

/** The major node a hub id belongs to ("BOM-LMDH-2" -> "BOM", "DEL" -> "DEL"). */
export function majorIdOfNode(nodeId: string): MajorNodeId {
  return nodeId.split('-LMDH-')[0] as MajorNodeId
}
