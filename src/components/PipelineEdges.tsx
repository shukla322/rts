import { Polyline } from 'react-leaflet'

interface Point {
  lat: number
  lng: number
}

interface Props {
  points: Point[]
  dashed?: boolean
}

export default function PipelineEdges({ points, dashed = true }: Props) {
  const positions = points.map((n) => [n.lat, n.lng] as [number, number])

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#783965',
        weight: 3,
        opacity: 0.45,
        dashArray: dashed ? '2 10' : undefined,
        lineCap: 'round',
      }}
    />
  )
}
