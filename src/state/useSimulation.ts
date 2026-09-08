import { useCallback, useReducer } from 'react'
import { ROUTES, type RouteId } from '../data/routes'

export type SimStatus = 'idle' | 'auction-live' | 'bought' | 'unsold'

export interface SimState {
  routeId: RouteId
  status: SimStatus
  /** node index the shipment currently sits at / is highlighted at */
  highlightedIndex: number
  /** node index where the live auction zone + Sold/Not-Sold buttons are, if any */
  auctionIndex: number | null
}

type SimAction =
  | { type: 'SELECT_ROUTE'; routeId: RouteId }
  | { type: 'RUN_SIMULATION' }
  | { type: 'SOLD' }
  | { type: 'NOT_SOLD' }
  | { type: 'RESET' }

function initialStateFor(routeId: RouteId): SimState {
  return { routeId, status: 'idle', highlightedIndex: 0, auctionIndex: null }
}

const initialState: SimState = initialStateFor(ROUTES[0].id)

function lastIndexFor(routeId: RouteId): number {
  return ROUTES.find((r) => r.id === routeId)!.cities.length - 1
}

function reducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'SELECT_ROUTE':
      if (action.routeId === state.routeId) return state
      return initialStateFor(action.routeId)

    case 'RUN_SIMULATION':
      if (state.status !== 'idle') return state
      return { ...state, status: 'auction-live', auctionIndex: 1 }

    case 'SOLD':
      if (state.status !== 'auction-live') return state
      return { ...state, status: 'bought' }

    case 'NOT_SOLD': {
      if (state.status !== 'auction-live' || state.auctionIndex === null) return state
      const settledIndex = state.auctionIndex
      const lastIndex = lastIndexFor(state.routeId)
      if (settledIndex >= lastIndex) {
        return { ...state, status: 'unsold', highlightedIndex: settledIndex, auctionIndex: null }
      }
      return {
        ...state,
        status: 'auction-live',
        highlightedIndex: settledIndex,
        auctionIndex: settledIndex + 1,
      }
    }

    case 'RESET':
      return initialStateFor(state.routeId)

    default:
      return state
  }
}

export function useSimulation() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const selectRoute = useCallback((routeId: RouteId) => dispatch({ type: 'SELECT_ROUTE', routeId }), [])
  const runSimulation = useCallback(() => dispatch({ type: 'RUN_SIMULATION' }), [])
  const sold = useCallback(() => dispatch({ type: 'SOLD' }), [])
  const notSold = useCallback(() => dispatch({ type: 'NOT_SOLD' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return { state, selectRoute, runSimulation, sold, notSold, reset }
}
