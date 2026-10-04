import { useMemo, useState } from 'react'
import { HISTORY_WINDOW_DAYS } from '../../data/assumptions'
import { filterRuns, type LayerFilter } from '../../data/selectors'
import { useRunStore } from '../../state/runStore'
import { Button, PageHeader, PageShell } from '../ui'
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
      <section className="dashboard-detail" aria-label="Return breakdowns">
        <div className="dashboard-section-heading">
          <div><h2>Explore your returns</h2><p>Compare outcomes across products, sellers, and destinations.</p></div>
          {layerFilter && <Button variant="outline" size="sm" onClick={() => setLayerFilter(undefined)}>
            {layerFilter === 'unsold' ? 'Unsold' : `Layer ${layerFilter}`} filter &times;
          </Button>}
        </div>
        <Breakdowns runs={filteredRuns} />
      </section>
      <AssumptionsDrawer />
    </PageShell>
  )
}
