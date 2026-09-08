export type NodeId = 'LMDH' | 'DSC' | 'IGH' | 'SSC' | 'FMH'

export interface HubNode {
  id: NodeId
  name: string
  city: string
  lat: number
  lng: number
}

export type ZoneColor = 'green' | 'yellow' | 'orange' | 'red'

export const ZONE_COLOR_HEX: Record<ZoneColor, { fill: string; stroke: string }> = {
  green: { fill: '#8bc98a', stroke: '#5fa25e' },
  yellow: { fill: '#f6d743', stroke: '#c9a91a' },
  orange: { fill: '#f4a340', stroke: '#c97e1e' },
  red: { fill: '#e2534d', stroke: '#b53a35' },
}
