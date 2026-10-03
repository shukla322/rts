import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import type { MajorNode } from '../data/network'
import { useIsMobile } from '../hooks/useIsMobile'

export type MajorRole = 'idle' | 'ssc' | 'dsc' | 'context'

interface Props {
  node: MajorNode
  role: MajorRole
  clickable: boolean
  isCurrentLocation?: boolean
  onClick: () => void
}

const ROLE_TAG: Record<MajorRole, string | null> = {
  idle: null,
  ssc: 'SSC',
  dsc: 'DSC',
  context: null,
}

export default function MajorNodeMarker({ node, role, clickable, isCurrentLocation = false, onClick }: Props) {
  const isMobile = useIsMobile()

  const icon = useMemo(() => {
    const tag = ROLE_TAG[role]
    // Bigger tap target on phones — see the matching note in NodeMarker.
    const size = isMobile ? 26 : 16
    return L.divIcon({
      className: '',
      html: `
        <div class="major-marker major-marker-${role} ${isMobile ? 'is-mobile' : ''} ${clickable ? 'is-clickable' : ''}">
          ${isCurrentLocation ? '<div class="hub-marker-callout">RTO Product Here</div>' : ''}
          <span class="major-marker-dot"></span>
          ${tag ? `<div class="major-marker-info"><span class="major-marker-tag-pill">${tag}</span></div>` : ''}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, role, clickable, isCurrentLocation, isMobile])

  return (
    <Marker
      position={[node.lat, node.lng]}
      icon={icon}
      // Not shown as a visible tag (removed per design — redundant with the
      // base map's own place names), but kept as a native hover tooltip so
      // the node's identity is still discoverable on hover.
      title={node.city}
      zIndexOffset={role === 'ssc' || role === 'dsc' ? 5000 : 0}
      eventHandlers={clickable ? { click: onClick } : {}}
    />
  )
}
