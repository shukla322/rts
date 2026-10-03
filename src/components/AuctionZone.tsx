import { useEffect, useState } from 'react'
import { Circle } from 'react-leaflet'
import { ZONE_COLOR_HEX, type HubNode, type ZoneColor } from '../data/nodes'

interface Props {
  node: HubNode
  color: ZoneColor
  radiusMeters?: number
}

const DEFAULT_ZONE_RADIUS_METERS = 200000
const GROW_DURATION_MS = 600

export default function AuctionZone({ node, color, radiusMeters = DEFAULT_ZONE_RADIUS_METERS }: Props) {
  const hex = ZONE_COLOR_HEX[color]
  const [radius, setRadius] = useState(0)

  useEffect(() => {
    // Animate the real radius (meters) from 0 up to the target, rather than
    // a CSS transform: Leaflet's SVG paths live in a pane-relative pixel
    // space that resets on every pan, so a transform-origin-based scale can
    // end up centered on the wrong point. Driving the actual Leaflet prop
    // lets it re-project correctly on every frame.
    setRadius(0)
    let frame: number
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / GROW_DURATION_MS, 1)
      const eased = 1 - (1 - t) ** 3
      setRadius(radiusMeters * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [node.id, radiusMeters])

  return (
    <Circle
      center={[node.lat, node.lng]}
      radius={radius}
      className="auction-zone"
      pathOptions={{
        color: hex.stroke,
        fillColor: hex.fill,
        fillOpacity: 0.25,
        weight: 2,
        opacity: 0.7,
      }}
    />
  )
}
