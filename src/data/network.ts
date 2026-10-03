import type { HubNode } from './nodes'

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

// ---- Network path (SSC <-> DSC), hardcoded via fixed region/gateway data ----
// Every major belongs to one region; every non-central region has a single
// gateway major that stands in for it when connecting to another region.
// The chain between any two majors is assembled from this fixed table, never
// computed from live distances — it just avoids hand-typing all 91 pairs.
type Region = 'NE' | 'E' | 'S' | 'W' | 'N' | 'CENTRAL'

const MAJOR_REGION: Record<MajorNodeId, Region> = {
  GUW: 'NE',
  KOL: 'E',
  BBS: 'E',
  CHE: 'S',
  HYD: 'S',
  BLR: 'S',
  TRV: 'S',
  BOM: 'W',
  PUN: 'W',
  AMD: 'W',
  JAI: 'N',
  DEL: 'N',
  DEH: 'N',
  BHO: 'CENTRAL',
}

const REGION_GATEWAY: Record<Region, MajorNodeId> = {
  NE: 'GUW',
  E: 'KOL',
  S: 'HYD',
  W: 'BOM',
  N: 'DEL',
  CENTRAL: 'BHO',
}

export function getNetworkPath(fromId: MajorNodeId, toId: MajorNodeId): MajorNodeId[] {
  const fromRegion = MAJOR_REGION[fromId]
  const toRegion = MAJOR_REGION[toId]
  const chain: MajorNodeId[] = [fromId]

  if (fromRegion !== toRegion) {
    const fromGateway = REGION_GATEWAY[fromRegion]
    const toGateway = REGION_GATEWAY[toRegion]
    if (fromId !== fromGateway) chain.push(fromGateway)
    if (fromRegion !== 'CENTRAL' && toRegion !== 'CENTRAL') chain.push('BHO')
    if (toId !== toGateway) chain.push(toGateway)
  }
  chain.push(toId)

  return chain.filter((id, i) => i === 0 || id !== chain[i - 1])
}

// ---- LMDH minor nodes (fixed radial offsets per major, one red + rest magenta) ----
const LMDH_OFFSETS: { angleDeg: number; radiusDeg: number }[] = [
  { angleDeg: 0, radiusDeg: 0.35 },
  { angleDeg: 72, radiusDeg: 0.45 },
  { angleDeg: 144, radiusDeg: 0.3 },
  { angleDeg: 216, radiusDeg: 0.5 },
  { angleDeg: 288, radiusDeg: 0.4 },
]

function offsetLatLng(lat: number, lng: number, angleDeg: number, radiusDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  const dLat = radiusDeg * Math.sin(rad)
  const dLng = (radiusDeg * Math.cos(rad)) / Math.cos((lat * Math.PI) / 180)
  return { lat: lat + dLat, lng: lng + dLng }
}

export function getLmdhsForMajor(majorId: MajorNodeId): { red: HubNode; magenta: HubNode[] } {
  const major = getMajorNode(majorId)
  const nodes = LMDH_OFFSETS.map((offset, i) => {
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
