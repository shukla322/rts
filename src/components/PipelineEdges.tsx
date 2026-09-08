import { Polyline } from 'react-leaflet'
import type { HubNode } from '../data/nodes'

interface Props {
  cities: HubNode[]
}

export default function PipelineEdges({ cities }: Props) {
  const positions = cities.map((n) => [n.lat, n.lng] as [number, number])

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#580b46',
        weight: 3,
        opacity: 0.45,
        dashArray: '2 10',
        lineCap: 'round',
      }}
    />
  )
}
