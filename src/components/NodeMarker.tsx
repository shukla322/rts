import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import type { HubNode } from '../data/nodes'
import { useIsMobile } from '../hooks/useIsMobile'

interface Props {
  node: HubNode
  label: string
  isActive: boolean
  compactCallouts: boolean
  refused?: boolean
  hideLabel?: boolean
  /** Layer 2 boost-reason tag shown under the marker. */
  badge?: { text: string; bg: string; fg: string }
  /** Click on the dot, e.g. to open node stats. Markers carry no auction actions. */
  onInfo?: () => void
}

/** A hub on the map. Display only: every Sold / Not Sold action lives in the side panels. */
export default function NodeMarker({
  node,
  label,
  isActive,
  compactCallouts,
  refused = false,
  hideLabel = false,
  badge,
  onInfo,
}: Props) {
  const isMobile = useIsMobile()

  const icon = useMemo(() => {
    const calloutClass = `hub-marker-callout${compactCallouts ? ' is-compact' : ''}`
    // On phones, the dot doubles as the tap target, so it needs to be
    // meaningfully bigger than the 20px desktop size to stay comfortably
    // tappable — the box is always sized to match exactly (see below).
    const size = isMobile ? 30 : 20
    return L.divIcon({
      className: '',
      html: `
        <div class="hub-marker ${isMobile ? 'is-mobile' : ''} ${isActive ? 'is-active' : ''} ${refused ? 'is-refused' : ''}">
          ${isActive ? `<div class="${calloutClass}">RTO Product Here</div>` : ''}
          ${refused ? `<div class="${calloutClass} hub-marker-refused-callout">Refused</div>` : ''}
          <span class="hub-marker-dot"></span>
          <div class="hub-marker-info">
            ${
              hideLabel
                ? ''
                : `<span class="hub-marker-label">
                     ${label}
                     <span class="hub-marker-city">${node.city}</span>
                   </span>`
            }
            ${
              badge
                ? `<span class="boost-pill" style="background:${badge.bg};color:${badge.fg}">${badge.text}</span>`
                : ''
            }
          </div>
        </div>
      `,
      // The box is always sized to match the dot exactly — the label is
      // absolutely positioned off to the side (see .hub-marker-info), so it
      // never grows this box and skews the anchor away from the pin.
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, label, isActive, compactCallouts, refused, hideLabel, badge?.text, isMobile])

  return <Marker position={[node.lat, node.lng]} icon={icon} eventHandlers={onInfo ? { click: onInfo } : {}} />
}
