import type { Layer } from '../../data/types'

// Solid, soft plum and saffron shades; labels, tooltips, and table views
// distinguish outcomes and preserve exact values without patterns.
export const LAYER_COLOR: Record<Layer | 'unsold', string> = {
  1: '#b778a5',
  2: '#f5ba5c',
  3: '#dec0d5',
  unsold: '#f9dfb1',
}

export const LAYER_FILL = LAYER_COLOR

export const LAYER_LABEL: Record<Layer | 'unsold', string> = {
  1: 'Layer 1',
  2: 'Layer 2',
  3: 'Layer 3',
  unsold: 'Unsold',
}

export const SINGLE_SERIES_COLOR = LAYER_COLOR[1]
