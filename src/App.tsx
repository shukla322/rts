import { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MapStage from './components/MapStage'
import PricingCard from './components/PricingCard'
import EndScreen from './components/EndScreen'
import { useSimulation } from './state/useSimulation'
import { getRoute } from './data/routes'
import { DEFAULT_PRICING_CONFIG, type PricingConfig } from './data/pricing'

export default function App() {
  const { state, selectRoute, runSimulation, sold, notSold, reset } = useSimulation()
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG)

  const route = getRoute(state.routeId)
  const lastIndex = route.cities.length - 1
  const pricingNodeIndex = state.status === 'idle' ? null : state.auctionIndex
  const pricingNode = pricingNodeIndex !== null ? route.cities[pricingNodeIndex] : null

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-white overflow-hidden">
      <Header simulationVisible={state.status === 'idle'} onRunSimulation={runSimulation} />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          activeRouteId={state.routeId}
          onSelect={selectRoute}
          pricingConfig={pricingConfig}
          onPricingConfigChange={setPricingConfig}
          totalEdges={lastIndex}
          edgesTraversed={state.highlightedIndex}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0">
            <PricingCard
              node={pricingNode}
              nodeIndex={pricingNodeIndex}
              lastIndex={lastIndex}
              pricingConfig={pricingConfig}
              auctionLive={state.status === 'auction-live'}
              onSold={sold}
              onNotSold={notSold}
            />
            <MapStage route={route} state={state} onSold={sold} onNotSold={notSold} />
          </div>
        </div>
      </div>

      <EndScreen
        status={state.status}
        auctionIndex={state.auctionIndex}
        lastIndex={lastIndex}
        pricingConfig={pricingConfig}
        node={pricingNode}
        onReset={reset}
      />
    </div>
  )
}
