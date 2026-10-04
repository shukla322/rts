import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { HISTORY_COUNT, HISTORY_SEED } from '../data/assumptions'
import type { RunRecord } from '../data/types'
import { generateHistory, startOfToday } from '../engine/generateHistory'

type RunAction = { type: 'ADD_RUN'; run: RunRecord }

function reducer(runs: RunRecord[], action: RunAction): RunRecord[] {
  switch (action.type) {
    case 'ADD_RUN':
      return [...runs, action.run]
    default:
      return runs
  }
}

interface RunStore {
  runs: RunRecord[]
  addRun: (run: RunRecord) => void
}

const RunStoreContext = createContext<RunStore | null>(null)

/**
 * All run records, seeded + live. Seeded history is generated on mount from a
 * fixed seed; live runs live in memory only, so a refresh resets them.
 */
export function RunStoreProvider({ children }: { children: ReactNode }) {
  const [runs, dispatch] = useReducer(reducer, undefined, () =>
    generateHistory(HISTORY_SEED, HISTORY_COUNT, startOfToday()),
  )
  const addRun = useCallback((run: RunRecord) => dispatch({ type: 'ADD_RUN', run }), [])
  const value = useMemo(() => ({ runs, addRun }), [runs, addRun])
  return <RunStoreContext.Provider value={value}>{children}</RunStoreContext.Provider>
}

export function useRunStore(): RunStore {
  const ctx = useContext(RunStoreContext)
  if (!ctx) throw new Error('useRunStore must be used inside <RunStoreProvider>')
  return ctx
}
