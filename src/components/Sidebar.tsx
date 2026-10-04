import { getMajorNode, MAJOR_NODES, type MajorNodeId } from '../data/network'
import { COST_PER_EDGE_RANGE, MARGIN_RANGE, type PricingConfig } from '../data/pricing'
import type { SimState } from '../state/useSimulation'
import { inr } from '../utils/format'
import ProductPicker from './ProductPicker'
import { Button, Select, Section, Stat } from './ui'

/** Quick-start routes: pick one instead of choosing source and destination separately. */
const PRESET_ROUTES: { ssc: MajorNodeId; dsc: MajorNodeId }[] = [
  { ssc: 'GUW', dsc: 'BOM' },
  { ssc: 'DEL', dsc: 'CHE' },
  { ssc: 'KOL', dsc: 'BLR' },
  { ssc: 'PUN', dsc: 'JAI' },
  { ssc: 'HYD', dsc: 'DEH' },
]

const NODE_OPTIONS = MAJOR_NODES.map((m) => ({ value: m.id, label: m.city }))
const ROUTE_OPTIONS = PRESET_ROUTES.map((r, i) => ({
  value: String(i),
  label: `${getMajorNode(r.ssc).city} → ${getMajorNode(r.dsc).city}`,
}))

interface Props {
  state: SimState
  onReset: () => void
  onSelectSsc: (id: MajorNodeId) => void
  onSelectDsc: (id: MajorNodeId) => void
  onSelectRoute: (sscId: MajorNodeId, dscId: MajorNodeId) => void
  productId: string
  onSelectProduct: (productId: string) => void
  pricingConfig: PricingConfig
  onPricingConfigChange: (config: PricingConfig) => void
}

/** Left panel: set up a return (route, product, pricing). */
export default function Sidebar({
  state,
  onReset,
  onSelectSsc,
  onSelectDsc,
  onSelectRoute,
  productId,
  onSelectProduct,
  pricingConfig,
  onPricingConfigChange,
}: Props) {
  const selecting = state.phase === 'select-ssc' || state.phase === 'select-dsc'
  const sscCity = state.sscId ? getMajorNode(state.sscId).city : null
  const dscCity = state.dscId ? getMajorNode(state.dscId).city : null

  const totalEdges = state.layer3Path.length - 1
  const showLogisticsStats = state.phase === 'layer3' || (state.phase === 'bought' && state.boughtAt?.layer === 3)

  return (
    <aside className="w-full md:w-[30vw] lg:min-w-[400px] shrink-0 md:h-full overflow-visible md:overflow-y-auto bg-bg-beige border-b md:border-b-0 md:border-r border-header-purple/10 px-4 py-5">
      <div className="flex flex-col gap-5">
        <Section step={1} title="Choose source & destination">
          {selecting ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Choose source"
                  placeholder="Select"
                  value={state.sscId ?? ''}
                  options={NODE_OPTIONS}
                  onChange={(id) => onSelectSsc(id as MajorNodeId)}
                  disabled={state.phase !== 'select-ssc'}
                />
                <Select
                  label="Choose destination"
                  placeholder="Select"
                  value=""
                  options={NODE_OPTIONS.filter((o) => o.value !== state.sscId)}
                  onChange={(id) => onSelectDsc(id as MajorNodeId)}
                  disabled={state.phase !== 'select-dsc'}
                />
              </div>
              <p className="text-center text-caption font-extrabold uppercase tracking-wider text-header-purple/40">or</p>
              <Select
                label="Choose route"
                placeholder="Select a preset route"
                value=""
                options={ROUTE_OPTIONS}
                onChange={(i) => {
                  const route = PRESET_ROUTES[Number(i)]
                  if (route) onSelectRoute(route.ssc, route.dsc)
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-header-purple">
                {sscCity} <span className="text-header-purple/40">→</span> {dscCity}
              </p>
              <Button variant="ghost" size="sm" onClick={onReset}>
                Reset
              </Button>
            </div>
          )}
        </Section>

        <Section step={2} title="Choose product">
          <ProductPicker productId={productId} disabled={!selecting} onSelect={onSelectProduct} />
        </Section>

        <Section step={3} title="Pricing assumptions">
          <div className="flex flex-col gap-4">
            <SliderRow
              label="Cost per Leg"
              valueLabel={inr(pricingConfig.costPerEdge)}
              {...COST_PER_EDGE_RANGE}
              value={pricingConfig.costPerEdge}
              onChange={(costPerEdge) => onPricingConfigChange({ ...pricingConfig, costPerEdge })}
            />
            <SliderRow
              label="Discount Margin"
              valueLabel={pricingConfig.margin.toFixed(2)}
              {...MARGIN_RANGE}
              value={pricingConfig.margin}
              onChange={(margin) => onPricingConfigChange({ ...pricingConfig, margin })}
            />
          </div>
        </Section>

        {showLogisticsStats && (
          <Section title="Logistics Costs">
            <div className="flex flex-col gap-2">
              <Stat
                size="sm"
                quiet
                label="Average Reverse Logistics Price"
                value={inr(pricingConfig.costPerEdge * totalEdges)}
              />
              <Stat
                size="sm"
                quiet
                label="Current Amount Spent on Return Trip"
                value={inr(pricingConfig.costPerEdge * state.highlightedIndex)}
              />
            </div>
          </Section>
        )}
      </div>
    </aside>
  )
}

interface SliderRowProps {
  label: string
  valueLabel: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}

function SliderRow({ label, valueLabel, min, max, step, value, onChange }: SliderRowProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-body font-semibold text-header-purple/80">
        <span>{label}</span>
        <span className="text-header-purple">{valueLabel}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-highlight-orange"
      />
    </label>
  )
}
