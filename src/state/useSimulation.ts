import { useCallback, useReducer } from 'react'
import { getLmdhsForMajor, getNetworkPath, qualifyingLayer2Majors, type MajorNodeId } from '../data/network'

export type Phase = 'select-ssc' | 'select-dsc' | 'layer1' | 'layer2' | 'layer3' | 'bought' | 'unsold'

export interface BoughtNode {
  id: string
  city: string
  lat: number
  lng: number
}

export interface BoughtAt extends BoughtNode {
  layer: 1 | 2 | 3
}

export interface SimState {
  phase: Phase
  sscId: MajorNodeId | null
  dscId: MajorNodeId | null
  layer1Pending: string[]
  layer2Pending: MajorNodeId[]
  layer3Path: MajorNodeId[]
  highlightedIndex: number
  auctionIndex: number | null
  boughtAt: BoughtAt | null
}

type SimAction =
  | { type: 'SELECT_SSC'; id: MajorNodeId }
  | { type: 'SELECT_DSC'; id: MajorNodeId }
  | { type: 'SELECT_ROUTE'; sscId: MajorNodeId; dscId: MajorNodeId }
  | { type: 'REPLAY'; sscId: MajorNodeId; dscId: MajorNodeId }
  | { type: 'BUY'; node: BoughtNode }
  | { type: 'NOT_SOLD'; id: string }
  | { type: 'SKIP_LAYER' }
  | { type: 'RESET' }

const initialState: SimState = {
  phase: 'select-ssc',
  sscId: null,
  dscId: null,
  layer1Pending: [],
  layer2Pending: [],
  layer3Path: [],
  highlightedIndex: 0,
  auctionIndex: null,
  boughtAt: null,
}

function reducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'SELECT_SSC':
      if (state.phase !== 'select-ssc') return state
      return { ...initialState, phase: 'select-dsc', sscId: action.id }

    case 'SELECT_DSC': {
      if (state.phase !== 'select-dsc' || action.id === state.sscId) return state
      const magentaIds = getLmdhsForMajor(action.id).magenta.map((n) => n.id)
      return {
        ...state,
        phase: 'layer1',
        dscId: action.id,
        layer1Pending: magentaIds,
      }
    }

    case 'SELECT_ROUTE':
      if ((state.phase !== 'select-ssc' && state.phase !== 'select-dsc') || action.sscId === action.dscId) return state
      return startRoute(action.sscId, action.dscId)

    // Dashboard replay: works from any phase, as RESET + SELECT_ROUTE in one step.
    case 'REPLAY':
      if (action.sscId === action.dscId) return state
      return startRoute(action.sscId, action.dscId)

    case 'BUY':
      if (state.phase !== 'layer1' && state.phase !== 'layer2' && state.phase !== 'layer3') return state
      return {
        ...state,
        phase: 'bought',
        boughtAt: {
          ...action.node,
          layer: state.phase === 'layer1' ? 1 : state.phase === 'layer2' ? 2 : 3,
        },
      }

    case 'NOT_SOLD': {
      if (state.phase === 'layer1') {
        const remaining = state.layer1Pending.filter((id) => id !== action.id)
        if (remaining.length > 0) return { ...state, layer1Pending: remaining }
        return advanceToLayer2(state)
      }

      if (state.phase === 'layer2') {
        const remaining = state.layer2Pending.filter((id) => id !== action.id)
        if (remaining.length > 0) return { ...state, layer2Pending: remaining }
        return startLayer3({ ...state, layer2Pending: [] })
      }

      if (state.phase === 'layer3') {
        if (state.auctionIndex === null) return state
        const settledIndex = state.auctionIndex
        const lastIndex = state.layer3Path.length - 1
        if (settledIndex >= lastIndex) {
          return { ...state, phase: 'unsold', highlightedIndex: settledIndex, auctionIndex: null }
        }
        return {
          ...state,
          highlightedIndex: settledIndex,
          auctionIndex: settledIndex + 1,
        }
      }

      return state
    }

    // Lets the operator skip ahead instead of declining every remaining
    // node in the current layer one at a time.
    case 'SKIP_LAYER': {
      if (state.phase === 'layer1') return advanceToLayer2(state)
      if (state.phase === 'layer2') return startLayer3({ ...state, layer2Pending: [] })
      return state
    }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

function startRoute(sscId: MajorNodeId, dscId: MajorNodeId): SimState {
  const magentaIds = getLmdhsForMajor(dscId).magenta.map((n) => n.id)
  return { ...initialState, phase: 'layer1', sscId, dscId, layer1Pending: magentaIds }
}

function advanceToLayer2(state: SimState): SimState {
  const layer2Pending = qualifyingLayer2Majors(state.sscId!, state.dscId!)
  if (layer2Pending.length === 0) {
    return startLayer3({ ...state, layer1Pending: [] })
  }
  return { ...state, phase: 'layer2', layer1Pending: [], layer2Pending }
}

function startLayer3(state: SimState): SimState {
  const layer3Path = getNetworkPath(state.dscId!, state.sscId!)
  if (layer3Path.length <= 1) {
    return { ...state, phase: 'unsold', layer3Path, highlightedIndex: 0, auctionIndex: null }
  }
  return { ...state, phase: 'layer3', layer3Path, highlightedIndex: 0, auctionIndex: 1 }
}

export function useSimulation() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const selectSsc = useCallback((id: MajorNodeId) => dispatch({ type: 'SELECT_SSC', id }), [])
  const selectDsc = useCallback((id: MajorNodeId) => dispatch({ type: 'SELECT_DSC', id }), [])
  const selectRoute = useCallback(
    (sscId: MajorNodeId, dscId: MajorNodeId) => dispatch({ type: 'SELECT_ROUTE', sscId, dscId }),
    [],
  )
  const replay = useCallback(
    (sscId: MajorNodeId, dscId: MajorNodeId) => dispatch({ type: 'REPLAY', sscId, dscId }),
    [],
  )
  const buy = useCallback((node: BoughtNode) => dispatch({ type: 'BUY', node }), [])
  const notSold = useCallback((id: string) => dispatch({ type: 'NOT_SOLD', id }), [])
  const skipLayer = useCallback(() => dispatch({ type: 'SKIP_LAYER' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return { state, selectSsc, selectDsc, selectRoute, replay, buy, notSold, skipLayer, reset }
}
