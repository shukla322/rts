import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import L, { type LeafletMouseEvent } from 'leaflet'
import { ZONE_COLOR_HEX, type HubNode, type ZoneColor } from '../data/nodes'

interface Props {
  node: HubNode
  isActive: boolean
  showActions: boolean
  auctionColor: ZoneColor | null
  compactCallouts: boolean
  onSold: () => void
  onNotSold: () => void
}

export default function NodeMarker({
  node,
  isActive,
  showActions,
  auctionColor,
  compactCallouts,
  onSold,
  onNotSold,
}: Props) {
  const icon = useMemo(() => {
    const auctionHex = auctionColor ? ZONE_COLOR_HEX[auctionColor].fill : null
    const calloutClass = `hub-marker-callout${compactCallouts ? ' is-compact' : ''}`
    const auctionCalloutClass = `hub-marker-auction-callout${compactCallouts ? ' is-compact' : ''}`
    return L.divIcon({
      className: '',
      html: `
        <div class="hub-marker ${isActive ? 'is-active' : ''}">
          ${isActive ? `<div class="${calloutClass}">RTO Product Here</div>` : ''}
          ${
            auctionHex
              ? `<div class="${auctionCalloutClass}" style="--zone-color: ${auctionHex}">Boosting Here</div>`
              : ''
          }
          <span class="hub-marker-dot"></span>
          <div class="hub-marker-info">
            <span class="hub-marker-label">
              ${node.id}
              <span class="hub-marker-city">${node.city}</span>
            </span>
            ${
              showActions
                ? `<div class="hub-actions">
                     <button type="button" class="hub-action-btn hub-action-sold">Sold</button>
                     <button type="button" class="hub-action-btn hub-action-not-sold">Not Sold</button>
                   </div>`
                : ''
            }
          </div>
        </div>
      `,
      // Fixed 20x20 box matching the dot exactly — the label/actions are
      // absolutely positioned off to the side (see .hub-marker-info), so
      // they never grow this box and skew the anchor away from the pin.
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, isActive, showActions, auctionColor, compactCallouts])

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
