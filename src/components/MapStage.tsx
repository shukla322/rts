import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  MAJOR_NODES,
  getLmdhsForMajor,
  getMajorNode,
  getNetworkPath,
  majorToHubNode,
  type MajorNodeId,
} from '../data/network'
import { getZoneColorForNode } from '../data/pricing'
import PipelineEdges from './PipelineEdges'
import AuctionZone from './AuctionZone'
import NodeMarker from './NodeMarker'
import MajorNodeMarker, { type MajorRole } from './MajorNodeMarker'
import type { BoughtNode, SimState } from '../state/useSimulation'

type FocusMode = 'adaptive' | 'stationary'

const LAYER1_RADIUS_METERS = 22500
const LAYER2_RADIUS_METERS = 150000

interface GeoPoint {
  lat: number
  lng: number
}

// Which points the camera should frame right now. Layer 1/2 can have several
// simultaneous auction targets instead of one, so this returns a list rather
// than a fixed pair of indices.
function getFocusPoints(state: SimState): GeoPoint[] {
  switch (state.phase) {
    case 'select-ssc':
    case 'select-dsc':
      return MAJOR_NODES

    case 'layer1': {
      if (!state.dscId) return MAJOR_NODES
      const dsc = getMajorNode(state.dscId)
      const { red, magenta } = getLmdhsForMajor(state.dscId)
      return [dsc, red, ...magenta]
    }

    case 'layer2': {
      if (!state.dscId) return MAJOR_NODES
      // SSC is deliberately excluded from the frame here — it can be on the
      // far side of the country, which was dragging this view out to a
      // near-national zoom even though every candidate sits near the DSC.
      return [getMajorNode(state.dscId), ...state.layer2Pending.map(getMajorNode)]
    }

    case 'layer3': {
      const path = state.layer3Path.map(getMajorNode)
      if (state.auctionIndex !== null) {
        return [path[state.highlightedIndex], path[state.auctionIndex]]
      }
      return [path[0], path[Math.min(1, path.length - 1)]]
    }

    case 'bought':
      return state.boughtAt ? [state.boughtAt] : MAJOR_NODES

    case 'unsold': {
      const path = state.layer3Path.map(getMajorNode)
      const last = path.length - 1
      return [path[Math.max(0, last - 1)], path[last]]
    }

    default:
      return MAJOR_NODES
  }
}

function MapFocus({
  state,
  mode,
  onFlyingChange,
}: {
  state: SimState
  mode: FocusMode
  onFlyingChange: (flying: boolean) => void
}) {
  const map = useMap()
  const points = mode === 'adaptive' ? getFocusPoints(state) : MAJOR_NODES
  const key = `${mode}|${points.map((p) => `${p.lat},${p.lng}`).join('|')}`

  useEffect(() => {
    // See AuctionZone/NodeMarker comments elsewhere: hide the zone circle(s)
    // for the flight's duration to sidestep a Leaflet re-projection glitch,
    // then let them pop back in on `moveend`.
    onFlyingChange(true)

    if (points.length === 1) {
      map.flyTo([points[0].lat, points[0].lng], 6, { duration: 1.1 })
    } else {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
      map.flyToBounds(bounds, { padding: [60, 60], duration: 1.1 })
    }

    const handleMoveEnd = () => onFlyingChange(false)
    map.once('moveend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key])

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
  state: SimState
  onSelectSsc: (id: MajorNodeId) => void
  onSelectDsc: (id: MajorNodeId) => void
  onBuy: (node: BoughtNode) => void
  onNotSold: (id: string) => void
}

export default function MapStage({ state, onSelectSsc, onSelectDsc, onBuy, onNotSold }: Props) {
  const [focusMode, setFocusMode] = useState<FocusMode>('adaptive')
  const [mapFlying, setMapFlying] = useState(false)
  const compactCallouts = focusMode === 'stationary'

  const handleMajorClick = (id: MajorNodeId) => {
    if (state.phase === 'select-ssc') onSelectSsc(id)
    else if (state.phase === 'select-dsc') onSelectDsc(id)
  }

  const lmdhs = state.phase === 'layer1' && state.dscId ? getLmdhsForMajor(state.dscId) : null

  const pathPoints = useMemo(() => {
    if (!state.sscId || !state.dscId) return []
    return getNetworkPath(state.sscId, state.dscId).map(getMajorNode)
  }, [state.sscId, state.dscId])

  return (
    <div className="h-[60vh] md:h-full md:flex-1 min-h-0 relative">
      <FocusModeToggle mode={focusMode} onChange={setFocusMode} />
      <MapContainer
        center={[21, 82]}
        zoom={5}
        minZoom={3}
        maxZoom={9}
        scrollWheelZoom
        className="h-full w-full"
        // Leaflet's own touch "tap" handling (a workaround for an old mobile
        // Safari 300ms click-delay quirk) listens to touchstart/touchend
        // itself and can swallow taps before they reach our marker click
        // handlers — modern mobile browsers already fire `click` natively
        // and immediately on tap, so disable it at construction. (@types/
        // leaflet is missing this option even though Leaflet itself has it,
        // hence the cast.)
        {...({ tap: false } as object)}
      >
        <MapFocus state={state} mode={focusMode} onFlyingChange={setMapFlying} />
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {pathPoints.length > 1 && <PipelineEdges points={pathPoints} dashed={false} />}

        {MAJOR_NODES.map((major) => {
          const role: MajorRole =
            major.id === state.sscId
              ? 'ssc'
              : major.id === state.dscId
                ? 'dsc'
                : state.phase === 'select-ssc' || state.phase === 'select-dsc'
                  ? 'idle'
                  : 'context'
          const clickable =
            state.phase === 'select-ssc' || (state.phase === 'select-dsc' && major.id !== state.sscId)
          return (
            <MajorNodeMarker
              key={major.id}
              node={major}
              role={role}
              clickable={clickable}
              isCurrentLocation={(state.phase === 'layer1' || state.phase === 'layer2') && major.id === state.dscId}
              onClick={() => handleMajorClick(major.id)}
            />
          )
        })}

        {lmdhs && state.dscId && (
          <>
            {[lmdhs.red, ...lmdhs.magenta].map((node) => (
              <PipelineEdges key={`dsc-link-${node.id}`} points={[getMajorNode(state.dscId!), node]} dashed />
            ))}
            <NodeMarker
              node={lmdhs.red}
              label="LMDH"
              isActive={false}
              showActions={false}
              compactCallouts={compactCallouts}
              refused
              onSold={() => {}}
              onNotSold={() => {}}
            />
            {lmdhs.magenta.map((node) => (
              <NodeMarker
                key={node.id}
                node={node}
                label="LMDH"
                isActive={false}
                showActions={state.layer1Pending.includes(node.id)}
                hideNotSold
                compactCallouts={compactCallouts}
                onSold={() => onBuy({ id: node.id, city: node.city, lat: node.lat, lng: node.lng })}
                onNotSold={() => onNotSold(node.id)}
              />
            ))}
            {!mapFlying &&
              lmdhs.magenta
                .filter((node) => state.layer1Pending.includes(node.id))
                .map((node) => (
                  <AuctionZone key={`zone-${node.id}`} node={node} color="magenta" radiusMeters={LAYER1_RADIUS_METERS} />
                ))}
          </>
        )}

        {state.phase === 'layer2' &&
          state.layer2Pending.map((id) => {
            const node = majorToHubNode(getMajorNode(id))
            return (
              <NodeMarker
                key={id}
                node={node}
                label={id}
                isActive={false}
                showActions
                hideLabel
                hideNotSold
                compactCallouts={compactCallouts}
                onSold={() => onBuy({ id: node.id, city: node.city, lat: node.lat, lng: node.lng })}
                onNotSold={() => onNotSold(id)}
              />
            )
          })}
        {!mapFlying &&
          state.phase === 'layer2' &&
          state.layer2Pending.map((id) => (
            <AuctionZone
              key={`zone-${id}`}
              node={majorToHubNode(getMajorNode(id))}
              color="magenta"
              radiusMeters={LAYER2_RADIUS_METERS}
            />
          ))}

        {state.phase === 'layer3' &&
          (() => {
            const pathNodes = state.layer3Path.map((id) => majorToHubNode(getMajorNode(id)))
            const auctionLive = state.auctionIndex !== null
            const auctionNode = auctionLive ? pathNodes[state.auctionIndex!] : null
            const auctionColor = auctionLive ? getZoneColorForNode(state.auctionIndex!) : null
            return (
              <>
                {!mapFlying && auctionNode && auctionColor && <AuctionZone node={auctionNode} color={auctionColor} />}
                {pathNodes.map((node, index) => (
                  <NodeMarker
                    key={node.id}
                    node={node}
                    label={state.layer3Path[index]}
                    isActive={index === state.highlightedIndex}
                    showActions={index === state.auctionIndex}
                    hideLabel
                    compactCallouts={compactCallouts}
                    onSold={() => onBuy({ id: node.id, city: node.city, lat: node.lat, lng: node.lng })}
                    onNotSold={() => onNotSold(node.id)}
                  />
                ))}
              </>
            )
          })()}
      </MapContainer>
    </div>
  )
}
