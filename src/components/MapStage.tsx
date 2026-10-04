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
import type { SimState } from '../state/useSimulation'
import type { CategoryId } from '../data/types'
import { BOOST_REASON_META, getLayer2Bidders } from '../engine/boostReasons'
import NodePopup from './NodePopup'
import { Segmented } from './ui'

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
      // Tight padding for the whole-network views (page open, Layer 2) so they
      // sit closer in; the other phases keep the roomier frame.
      const wholeNetwork = mode === 'stationary' || state.phase === 'select-ssc' || state.phase === 'select-dsc'
      // Layer 3 frames just two hops, so it gets generous padding and a zoom cap
      // to stop short legs from zooming in too far on every move.
      const layer3 = state.phase === 'layer3'
      const pad = wholeNetwork ? 12 : state.phase === 'layer2' ? 36 : layer3 ? 150 : 60
      map.flyToBounds(bounds, { padding: [pad, pad], maxZoom: layer3 ? 6 : undefined, duration: 1.1 })
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

/** Camera mode switch, floating over the top-right of the map. */
function FocusModeToggle({ mode, onChange }: { mode: FocusMode; onChange: (mode: FocusMode) => void }) {
  return (
    <Segmented
      className="absolute top-3 right-3 z-[1000]"
      ariaLabel="Map camera"
      value={mode}
      onChange={onChange}
      options={[
        { value: 'adaptive', label: 'Adaptive' },
        { value: 'stationary', label: 'Stationary' },
      ]}
    />
  )
}

interface Props {
  state: SimState
  categoryId: CategoryId
  onUseAsSource: (id: MajorNodeId) => void
  onUseAsDestination: (id: MajorNodeId) => void
}

export default function MapStage({ state, categoryId, onUseAsSource, onUseAsDestination }: Props) {
  const [focusMode, setFocusMode] = useState<FocusMode>('adaptive')
  const [mapFlying, setMapFlying] = useState(false)
  const compactCallouts = focusMode === 'stationary'
  const [popupNodeId, setPopupNodeId] = useState<MajorNodeId | null>(null)

  // Layer 2 boost badge per qualifying node, for this product's category.
  const boostBadges = useMemo(() => {
    if (!state.sscId || !state.dscId) return {}
    return Object.fromEntries(
      getLayer2Bidders(state.sscId, state.dscId, categoryId).map((b) => [b.id, BOOST_REASON_META[b.primary]]),
    )
  }, [state.sscId, state.dscId, categoryId])

  const lmdhs = state.phase === 'layer1' && state.dscId ? getLmdhsForMajor(state.dscId) : null

  const pathPoints = useMemo(() => {
    if (!state.sscId || !state.dscId) return []
    return getNetworkPath(state.sscId, state.dscId).map(getMajorNode)
  }, [state.sscId, state.dscId])

  return (
    <div className="map-stage h-[60vh] md:h-full md:flex-1 min-h-0 md:min-w-0 relative">
      <FocusModeToggle mode={focusMode} onChange={setFocusMode} />
      <MapContainer
        center={[21, 82]}
        zoom={5}
        minZoom={3}
        maxZoom={9}
        // Quarter-step zoom so fitted views land snugly instead of rounding
        // down to the next whole zoom level.
        zoomSnap={0.25}
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
          return (
            <MajorNodeMarker
              key={major.id}
              node={major}
              role={role}
              clickable={state.phase === 'select-ssc' || state.phase === 'select-dsc'}
              isCurrentLocation={(state.phase === 'layer1' || state.phase === 'layer2') && major.id === state.dscId}
              onClick={() => setPopupNodeId(major.id)}
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
              compactCallouts={compactCallouts}
              refused
            />
            {lmdhs.magenta.map((node) => (
              <NodeMarker
                key={node.id}
                node={node}
                label="LMDH"
                isActive={false}
                                compactCallouts={compactCallouts}
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
                hideLabel
                badge={boostBadges[id] ? { text: boostBadges[id].short, bg: boostBadges[id].bg, fg: boostBadges[id].fg } : undefined}
                compactCallouts={compactCallouts}
                onInfo={() => setPopupNodeId(id)}
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
              // Circle colour follows the boost reason (priority: cart > frequency > density > sparse).
              hex={boostBadges[id] ? { fill: boostBadges[id].bg, stroke: boostBadges[id].stroke } : undefined}
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
                    hideLabel
                    compactCallouts={compactCallouts}
                    onInfo={() => setPopupNodeId(node.id as MajorNodeId)}
                  />
                ))}
              </>
            )
          })()}
      </MapContainer>

      {popupNodeId && (
        <NodePopup
          nodeId={popupNodeId}
          phase={state.phase}
          sscId={state.sscId}
          onClose={() => setPopupNodeId(null)}
          onUseAsSource={(id) => {
            onUseAsSource(id)
            setPopupNodeId(null)
          }}
          onUseAsDestination={(id) => {
            onUseAsDestination(id)
            setPopupNodeId(null)
          }}
        />
      )}
    </div>
  )
}
