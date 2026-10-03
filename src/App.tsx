import { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MapStage from './components/MapStage'
import PricingCard from './components/PricingCard'
import EndScreen from './components/EndScreen'
import { useSimulation } from './state/useSimulation'
import { DEFAULT_PRICING_CONFIG, type PricingConfig } from './data/pricing'

export default function App() {
  const { state, selectSsc, selectDsc, buy, notSold, skipLayer, reset } = useSimulation()
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG)

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-white overflow-y-auto md:overflow-hidden">
      <Header />

      <div className="flex-1 flex flex-col md:flex-row md:min-h-0">
        <Sidebar
          state={state}
          onReset={reset}
          pricingConfig={pricingConfig}
          onPricingConfigChange={setPricingConfig}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col md:flex-row md:min-h-0">
            {/* On phones the map — the actual interaction — comes before the
                pricing card, which is supplementary reading. */}
            <PricingCard
              state={state}
              pricingConfig={pricingConfig}
              onBuy={buy}
              onNotSold={notSold}
              onSkipLayer={skipLayer}
              className="order-last md:order-none"
            />
            <MapStage state={state} onSelectSsc={selectSsc} onSelectDsc={selectDsc} onBuy={buy} onNotSold={notSold} />
          </div>
        </div>
      </div>

      <EndScreen state={state} pricingConfig={pricingConfig} onReset={reset} />
    </div>
  )
}
