import { getMajorNode } from '../data/network'
import {
  COST_PER_EDGE_RANGE,
  MARGIN_RANGE,
  TOTAL_PRICE_RANGE,
  type PricingConfig,
} from '../data/pricing'
import type { SimState } from '../state/useSimulation'

interface Props {
  state: SimState
  onReset: () => void
  pricingConfig: PricingConfig
  onPricingConfigChange: (config: PricingConfig) => void
}

export default function Sidebar({ state, onReset, pricingConfig, onPricingConfigChange }: Props) {
  const sscCity = state.sscId ? getMajorNode(state.sscId).city : null
  const dscCity = state.dscId ? getMajorNode(state.dscId).city : null

  const totalEdges = state.layer3Path.length - 1
  const edgesTraversed = state.highlightedIndex
  const showLogisticsStats = state.phase === 'layer3' || (state.phase === 'bought' && state.boughtAt?.layer === 3)
  const avgReverseLogisticsPrice = pricingConfig.costPerEdge * totalEdges
  const currentAmountSpent = pricingConfig.costPerEdge * edgesTraversed

  return (
    <aside className="w-full md:w-80 shrink-0 md:h-full overflow-visible md:overflow-y-auto bg-bg-beige border-b md:border-b-0 md:border-r border-header-purple/10 px-4 py-5">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-header-purple/60 px-1">
        Choose source &amp; destination
      </p>
      <div className="mt-2 rounded-xl bg-bg-white px-3.5 py-3.5">
        {state.phase === 'select-ssc' && (
          <p className="text-[15px] font-extrabold text-header-purple">
            Click on your <span className="italic">Source Node</span>
          </p>
        )}
        {state.phase === 'select-dsc' && (
          <>
            <p className="text-[11px] font-semibold text-header-purple/50">Source</p>
            <p className="text-[13px] font-bold text-header-purple">{sscCity}</p>
            <p className="mt-2 text-[15px] font-extrabold text-header-purple">
              Now choose your <span className="italic">Destination</span>
            </p>
          </>
        )}
        {sscCity && dscCity && state.phase !== 'select-ssc' && state.phase !== 'select-dsc' && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-header-purple">
              {sscCity} <span className="text-header-purple/40">&rarr;</span> {dscCity}
            </p>
            <button
              type="button"
              onClick={onReset}
              className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-header-purple/50 hover:text-header-purple"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] font-extrabold uppercase tracking-wider text-header-purple/60 px-1 mt-6 mb-3">
        Pricing assumptions
      </p>
      <div className="rounded-xl bg-bg-white px-3.5 py-3.5 flex flex-col gap-4">
        <SliderRow
          label="Product Price"
          valueLabel={`₹${pricingConfig.totalPrice}`}
          min={TOTAL_PRICE_RANGE.min}
          max={TOTAL_PRICE_RANGE.max}
          step={TOTAL_PRICE_RANGE.step}
          value={pricingConfig.totalPrice}
          onChange={(totalPrice) => onPricingConfigChange({ ...pricingConfig, totalPrice })}
        />
        <SliderRow
          label="Cost per Leg"
          valueLabel={`₹${pricingConfig.costPerEdge}`}
          min={COST_PER_EDGE_RANGE.min}
          max={COST_PER_EDGE_RANGE.max}
          step={COST_PER_EDGE_RANGE.step}
          value={pricingConfig.costPerEdge}
          onChange={(costPerEdge) => onPricingConfigChange({ ...pricingConfig, costPerEdge })}
        />
        <SliderRow
          label="Discount Margin"
          valueLabel={pricingConfig.margin.toFixed(2)}
          min={MARGIN_RANGE.min}
          max={MARGIN_RANGE.max}
          step={MARGIN_RANGE.step}
          value={pricingConfig.margin}
          onChange={(margin) => onPricingConfigChange({ ...pricingConfig, margin })}
        />
      </div>

      {showLogisticsStats && (
        <>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-header-purple/60 px-1 mt-6 mb-3">
            Logistics Costs
          </p>
          <div className="rounded-xl bg-bg-white px-3.5 py-3.5 flex flex-col gap-3">
            <StatRow label="Average Reverse Logistics Price" value={avgReverseLogisticsPrice} />
            <StatRow label="Current Amount Spent on Return Trip" value={currentAmountSpent} />
          </div>
        </>
      )}
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
      <span className="flex items-center justify-between text-[12px] font-semibold text-header-purple/80">
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

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-header-purple/60 leading-snug">{label}</p>
      <p className="font-display font-extrabold text-header-purple text-base">₹{value.toFixed(0)}</p>
    </div>
  )
}
