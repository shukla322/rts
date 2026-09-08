import { ROUTES, type RouteId } from '../data/routes'
import {
  COST_PER_EDGE_RANGE,
  MARGIN_RANGE,
  TOTAL_PRICE_RANGE,
  type PricingConfig,
} from '../data/pricing'

interface Props {
  activeRouteId: RouteId
  onSelect: (id: RouteId) => void
  pricingConfig: PricingConfig
  onPricingConfigChange: (config: PricingConfig) => void
  totalEdges: number
  edgesTraversed: number
}

export default function Sidebar({
  activeRouteId,
  onSelect,
  pricingConfig,
  onPricingConfigChange,
  totalEdges,
  edgesTraversed,
}: Props) {
  const avgReverseLogisticsPrice = pricingConfig.costPerEdge * totalEdges
  const currentAmountSpent = pricingConfig.costPerEdge * edgesTraversed

  return (
    <aside className="w-80 shrink-0 h-full overflow-y-auto bg-bg-beige border-r border-header-purple/10 px-4 py-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-header-purple/60 px-1">
          Choose a route
        </span>
        <select
          value={activeRouteId}
          onChange={(e) => onSelect(e.target.value as RouteId)}
          className="w-full rounded-xl border-2 border-soft-pink bg-bg-white px-3 py-2.5 text-[13px] font-semibold text-header-purple shadow-glow-pink focus:outline-none"
        >
          {ROUTES.map((route) => (
            <option key={route.id} value={route.id}>
              {route.cities[0].city} → {route.cities[route.cities.length - 1].city}
            </option>
          ))}
        </select>
      </label>

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

      <p className="text-[11px] font-extrabold uppercase tracking-wider text-header-purple/60 px-1 mt-6 mb-3">
        Logistics Costs
      </p>
      <div className="rounded-xl bg-bg-white px-3.5 py-3.5 flex flex-col gap-3">
        <StatRow label="Average Reverse Logistics Price" value={avgReverseLogisticsPrice} />
        <StatRow label="Current Amount Spent on Return Trip" value={currentAmountSpent} />
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
