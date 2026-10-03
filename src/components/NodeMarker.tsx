import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import L, { type LeafletMouseEvent } from 'leaflet'
import type { HubNode } from '../data/nodes'
import { useIsMobile } from '../hooks/useIsMobile'

interface Props {
  node: HubNode
  label: string
  isActive: boolean
  showActions: boolean
  compactCallouts: boolean
  refused?: boolean
  hideLabel?: boolean
  hideNotSold?: boolean
  onSold: () => void
  onNotSold: () => void
}

export default function NodeMarker({
  node,
  label,
  isActive,
  showActions,
  compactCallouts,
  refused = false,
  hideLabel = false,
  hideNotSold = false,
  onSold,
  onNotSold,
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
              showActions
                ? `<div class="hub-actions">
                     <button type="button" class="hub-action-btn hub-action-sold">Sold</button>
                     ${
                       hideNotSold
                         ? ''
                         : '<button type="button" class="hub-action-btn hub-action-not-sold">Not Sold</button>'
                     }
                   </div>`
                : ''
            }
          </div>
        </div>
      `,
      // The box is always sized to match the dot exactly — the label/actions
      // are absolutely positioned off to the side (see .hub-marker-info), so
      // they never grow this box and skew the anchor away from the pin.
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, label, isActive, showActions, compactCallouts, refused, hideLabel, hideNotSold, isMobile])

  const handleClick = (e: LeafletMouseEvent) => {
    const target = e.originalEvent.target as HTMLElement
    if (target.closest('.hub-action-sold')) onSold()
    else if (target.closest('.hub-action-not-sold')) onNotSold()
  }

  return (
    <Marker
      position={[node.lat, node.lng]}
      icon={icon}
      // Leaflet stacks markers by screen Y-position by default, so a marker
      // further south can render on top of this one and cover its Sold /
      // Not Sold buttons. Force this marker above every other marker in the
      // pane whenever its actions are visible.
      zIndexOffset={showActions ? 10000 : 0}
      eventHandlers={showActions ? { click: handleClick } : {}}
    />
  )
}
