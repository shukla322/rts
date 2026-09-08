import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Route } from '../data/routes'
import { getZoneColorForNode } from '../data/pricing'
import PipelineEdges from './PipelineEdges'
import AuctionZone from './AuctionZone'
import NodeMarker from './NodeMarker'
import type { SimState } from '../state/useSimulation'

type FocusMode = 'adaptive' | 'stationary'

// Which two adjacent nodes the map should currently be framed on. While an
// auction is live this is always "where the shipment last stopped" paired
// with "where it's being auctioned next" — which also covers the moment a
// buyer says Sold, since that doesn't change either index. The only cases
// with no live auction are the very start (nothing has happened yet) and
// the very end (Not Sold at the last node, with nowhere further to go).
function getFocusWindow(state: SimState, lastIndex: number): [number, number] {
  if (state.auctionIndex !== null) {
    return [state.highlightedIndex, state.auctionIndex]
  }
  if (state.status === 'idle') {
    return [0, Math.min(1, lastIndex)]
  }
  return [Math.max(0, state.highlightedIndex - 1), state.highlightedIndex]
}

function MapFocus({
  route,
  state,
  mode,
  onFlyingChange,
}: {
  route: Route
  state: SimState
  mode: FocusMode
  onFlyingChange: (flying: boolean) => void
}) {
  const map = useMap()
  const lastIndex = route.cities.length - 1
  // Stationary always frames the whole route and never moves again on its
  // own — only a route switch or flipping back to Adaptive changes it.
  const [fromIndex, toIndex] = mode === 'adaptive' ? getFocusWindow(state, lastIndex) : [0, lastIndex]

  useEffect(() => {
    const from = route.cities[fromIndex]
    const to = route.cities[toIndex]
    const bounds = L.latLngBounds([
      [from.lat, from.lng],
      [to.lat, to.lng],
    ])

    // Leaflet fakes zoom animation by CSS-transforming the whole map pane as
    // one unit — fine for content whose position was already correct before
    // the flight started. The auction Circle's center changes in this same
    // tick though, so its geometry gets projected once against the stale
    // view and then has that transform piled on top, rendering clipped/wrong
    // until Leaflet's real re-projection on arrival. Hiding it for the
    // flight's duration and letting it pop back in on `moveend` sidesteps
    // the glitch entirely instead of fighting Leaflet's animation internals.
    onFlyingChange(true)
    map.flyToBounds(bounds, { padding: [100, 100], duration: 1.1 })

    const handleMoveEnd = () => onFlyingChange(false)
    map.once('moveend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route.id, fromIndex, toIndex, mode])

  return null
}

function FocusModeToggle({ mode, onChange }: { mode: FocusMode; onChange: (mode: FocusMode) => void }) {
  return (
    <div className="absolute top-3 right-3 z-[1000] flex gap-1 rounded-full bg-bg-white p-1 shadow-card">
      {(['adaptive', 'stationary'] as const).map((option) => {
        const active = mode === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-colors ${
              active ? 'bg-highlight-orange text-header-purple' : 'text-header-purple/50 hover:text-header-purple'
            }`}
          >
            {option === 'adaptive' ? 'Adaptive' : 'Stationary'}
          </button>
        )
      })}
    </div>
  )
}

interface Props {
  route: Route
  state: SimState
  onSold: () => void
  onNotSold: () => void
}

export default function MapStage({ route, state, onSold, onNotSold }: Props) {
  const [focusMode, setFocusMode] = useState<FocusMode>('adaptive')
  const [mapFlying, setMapFlying] = useState(false)
  const auctionLive = state.auctionIndex !== null && state.status === 'auction-live'
  const auctionNode = auctionLive ? route.cities[state.auctionIndex!] : null
  const auctionColor = auctionLive ? getZoneColorForNode(state.auctionIndex!) : null

  return (
    <div className="flex-1 min-h-0 relative">
      <FocusModeToggle mode={focusMode} onChange={setFocusMode} />
      <MapContainer center={[21, 82]} zoom={5} minZoom={3} maxZoom={9} scrollWheelZoom className="h-full w-full">
        <MapFocus route={route} state={state} mode={focusMode} onFlyingChange={setMapFlying} />
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <PipelineEdges cities={route.cities} />
        {!mapFlying && auctionNode && auctionColor && <AuctionZone node={auctionNode} color={auctionColor} />}
        {route.cities.map((node, index) => (
          <NodeMarker
            key={`${route.id}-${node.id}`}
            node={node}
            isActive={index === state.highlightedIndex}
            showActions={state.status === 'auction-live' && index === state.auctionIndex}
            auctionColor={index === state.auctionIndex ? auctionColor : null}
            compactCallouts={focusMode === 'stationary'}
            onSold={onSold}
            onNotSold={onNotSold}
          />
        ))}
      </MapContainer>
    </div>
  )
}
