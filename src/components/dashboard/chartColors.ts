import type { Layer } from '../../data/types'

// Layers are ordered, so they share one hue (the theme's magenta) stepped
// dark -> light, with a neutral for "unsold". Identity is never colour-alone:
// every chart has a legend and a table view.
export const LAYER_COLOR: Record<Layer | 'unsold', string> = {
  1: '#783965',
  2: '#d6409f',
  3: '#f2a5d0',
  unsold: '#cdc3b3',
}

export const LAYER_LABEL: Record<Layer | 'unsold', string> = {
  1: 'Layer 1',
  2: 'Layer 2',
  3: 'Layer 3',
  unsold: 'Unsold',
}

export const SINGLE_SERIES_COLOR = '#d6409f'
