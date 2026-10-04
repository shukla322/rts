export interface HubNode {
  id: string
  name: string
  city: string
  lat: number
  lng: number
}

export type ZoneColor = 'green' | 'yellow' | 'orange' | 'red' | 'magenta' | 'refused'

export const ZONE_COLOR_HEX: Record<ZoneColor, { fill: string; stroke: string }> = {
  green: { fill: '#8bc98a', stroke: '#5fa25e' },
  yellow: { fill: '#f6d743', stroke: '#c9a91a' },
  orange: { fill: '#f4a340', stroke: '#c97e1e' },
  red: { fill: '#ef4a59', stroke: '#c93545' },
  magenta: { fill: '#d6409f', stroke: '#a5207a' },
  refused: { fill: '#ef4a59', stroke: '#c93545' },
}
