import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header, { type Tab } from './components/Header'
import Sidebar from './components/Sidebar'
import MapStage from './components/MapStage'
import PricingCard from './components/PricingCard'
import EndScreen from './components/EndScreen'
import KpiStrip from './components/KpiStrip'
import Dashboard from './components/dashboard/Dashboard'
import History from './components/history/History'
import Sellers from './components/sellers/Sellers'
import { useSimulation } from './state/useSimulation'
import { RunStoreProvider, useRunStore } from './state/runStore'
import { DEFAULT_PRODUCT_ID, getProduct } from './data/catalog'
import { DEFAULT_PRICING_SLIDERS, type PricingConfig } from './data/pricing'
import type { MajorNodeId } from './data/network'
import type { RunRecord } from './data/types'
import { evaluateRun } from './engine/evaluateRun'

export default function App() {
  return (
    <RunStoreProvider>
      <AppShell />
    </RunStoreProvider>
  )
}

function AppShell() {
  const { state, selectSsc, selectDsc, selectRoute, replay, buy, notSold, skipLayer, reset } = useSimulation()
  const { runs, addRun } = useRunStore()
  // Simulation state lives here, above the tabs, so it survives tab switches.
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [productId, setProductId] = useState(DEFAULT_PRODUCT_ID)
  const [sliders, setSliders] = useState(DEFAULT_PRICING_SLIDERS)
  const [lastRun, setLastRun] = useState<RunRecord | null>(null)
  const liveCounter = useRef(0)

  const product = getProduct(productId)
  const pricingConfig: PricingConfig = useMemo(
    () => ({ totalPrice: product.price, costPerEdge: sliders.costPerEdge, margin: sliders.margin }),
    [product.price, sliders],
  )

  // Every finished simulation produces exactly one RunRecord.
  useEffect(() => {
    if ((state.phase !== 'bought' && state.phase !== 'unsold') || !state.sscId || !state.dscId) return
    liveCounter.current += 1
    const run = evaluateRun(
      {
        id: `live-${String(liveCounter.current).padStart(3, '0')}`,
        createdAt: Date.now(),
        source: 'live',
        product,
        sscId: state.sscId,
        dscId: state.dscId,
        costPerLeg: pricingConfig.costPerEdge,
        margin: pricingConfig.margin,
      },
      state.phase === 'bought' && state.boughtAt
        ? { soldLayer: state.boughtAt.layer, soldNodeId: state.boughtAt.id }
        : {},
    )
    addRun(run)
    setLastRun(run)
    // Only the phase transition should record a run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  const handleReplay = useCallback(
    (run: RunRecord) => {
      setProductId(run.productId)
      replay(run.sscId as MajorNodeId, run.dscId as MajorNodeId)
      setActiveTab('home')
    },
    [replay],
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-white overflow-y-auto md:overflow-hidden">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'home' && (
        <div className="flex-1 flex flex-col md:min-h-0">
          <KpiStrip runs={runs} />

          <div className="flex-1 flex flex-col md:flex-row md:min-h-0">
            <Sidebar
              state={state}
              onReset={reset}
              onSelectSsc={selectSsc}
              onSelectDsc={selectDsc}
              onSelectRoute={selectRoute}
              productId={productId}
              onSelectProduct={setProductId}
              pricingConfig={pricingConfig}
              onPricingConfigChange={(c) => setSliders({ costPerEdge: c.costPerEdge, margin: c.margin })}
            />

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 flex flex-col md:flex-row md:min-h-0">
                <MapStage
                  state={state}
                  categoryId={product.categoryId}
                  onUseAsSource={selectSsc}
                  onUseAsDestination={selectDsc}
                />
                {/* Layer definitions: rightmost on desktop, below the map on phones. */}
                <PricingCard
                  state={state}
                  pricingConfig={pricingConfig}
                  productId={productId}
                  onBuy={buy}
                  onNotSold={notSold}
                  onSkipLayer={skipLayer}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <main className="flex-1 md:min-h-0 md:overflow-y-auto bg-bg-white">
          <Dashboard />
        </main>
      )}

      {activeTab === 'history' && (
        <main className="flex-1 md:min-h-0 md:overflow-y-auto bg-bg-white">
          <History onReplay={handleReplay} />
        </main>
      )}

      {activeTab === 'sellers' && (
        <main className="flex-1 md:min-h-0 md:overflow-y-auto bg-bg-white">
          <Sellers />
        </main>
      )}

      <EndScreen state={state} run={lastRun} onReset={reset} />
    </div>
  )
}
