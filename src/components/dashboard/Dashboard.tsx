import { useMemo, useState } from 'react'
import { HISTORY_WINDOW_DAYS } from '../../data/assumptions'
import { filterRuns, type LayerFilter } from '../../data/selectors'
import { useRunStore } from '../../state/runStore'
import { PageHeader, PageShell } from '../ui'
import AssumptionsDrawer from './AssumptionsDrawer'
import Breakdowns from './Breakdowns'
import Funnel from './Funnel'
import KpiGrid from './KpiGrid'

export default function Dashboard() {
  const { runs } = useRunStore()
  // Set from the funnel; applied to the breakdowns below it.
  const [layerFilter, setLayerFilter] = useState<LayerFilter | undefined>(undefined)
  const filteredRuns = useMemo(() => filterRuns(runs, { layer: layerFilter }), [runs, layerFilter])

  return (
    <PageShell>
      <PageHeader
        title="Return-to-Sale dashboard"
        subtitle={`${runs.length.toLocaleString('en-IN')} returns · last ${HISTORY_WINDOW_DAYS} days`}
      />
      <KpiGrid runs={runs} />
      <Funnel runs={runs} layerFilter={layerFilter} onLayerFilterChange={setLayerFilter} />
      <Breakdowns runs={filteredRuns} />
      <AssumptionsDrawer />
    </PageShell>
  )
}
