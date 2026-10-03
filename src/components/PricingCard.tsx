import { getMajorNode, majorToHubNode } from '../data/network'
import { getLayer2Price, getPricingForNode, LAYER2_DISCOUNT, type PricingConfig } from '../data/pricing'
import type { BoughtNode, SimState } from '../state/useSimulation'

interface Props {
  state: SimState
  pricingConfig: PricingConfig
  onBuy: (node: BoughtNode) => void
  onNotSold: (id: string) => void
  onSkipLayer: () => void
  className?: string
}

export default function PricingCard({ state, pricingConfig, onBuy, onNotSold, onSkipLayer, className = '' }: Props) {
  const dscCity = state.dscId ? getMajorNode(state.dscId).city : null

  const layer3PathNodes = state.layer3Path.map((id) => majorToHubNode(getMajorNode(id)))
  const layer3LastIndex = layer3PathNodes.length - 1
  const layer3Node = state.auctionIndex !== null ? layer3PathNodes[state.auctionIndex] : null
  const layer3Pricing =
    state.phase === 'layer3' && state.auctionIndex !== null
      ? getPricingForNode(state.auctionIndex, layer3LastIndex, pricingConfig)
      : null

  const headline =
    state.phase === 'layer1'
      ? `Return auction · ${dscCity} LMDH network`
      : state.phase === 'layer2'
        ? 'Return auction · Nation-wide boosting'
        : state.phase === 'layer3' && layer3Node
          ? `Return auction · ${layer3Node.city}`
          : 'Live auction'

  return (
    <aside
      className={`w-full md:w-[340px] shrink-0 md:h-full overflow-visible md:overflow-y-auto bg-bg-white border-b md:border-b-0 md:border-r border-header-purple/10 flex flex-col ${className}`}
    >
      {/* Top half — product info */}
      <div className="flex-1 p-5 border-b border-header-purple/10 flex flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-header-purple/50 mb-3">{headline}</p>

        <ProductHeader />

        {state.phase === 'layer1' && (
          <>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-display font-extrabold text-highlight-orange">
                ₹{pricingConfig.totalPrice}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-header-purple">Delivery within 2 days</p>
          </>
        )}

        {state.phase === 'layer2' && (
          <>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-sm text-header-purple/45 line-through">₹{pricingConfig.totalPrice}</span>
              <span className="text-2xl font-display font-extrabold text-highlight-orange">
                ₹{getLayer2Price(pricingConfig).toFixed(0)}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-header-purple/60">
              Flat {(LAYER2_DISCOUNT * 100).toFixed(0)}% off · Delivery within 2–3 days
            </p>
          </>
        )}

        {state.phase === 'layer3' && layer3Node && layer3Pricing && (
          <>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-sm text-header-purple/45 line-through">₹{pricingConfig.totalPrice}</span>
              <span className="text-2xl font-display font-extrabold text-highlight-orange">
                ₹{layer3Pricing.discountedPrice.toFixed(0)}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-header-purple/60">Delivery Time: 2–3 days</p>
          </>
        )}

        {(state.phase === 'select-ssc' || state.phase === 'select-dsc') && (
          <p className="text-sm text-header-purple/50 mt-6 text-center">
            Choose a source and destination to begin.
          </p>
        )}

        {state.phase === 'layer3' && layer3Node && (
          <div className="mt-auto pt-4 flex gap-2">
            <button
              type="button"
              onClick={() =>
                onBuy({ id: layer3Node.id, city: layer3Node.city, lat: layer3Node.lat, lng: layer3Node.lng })
              }
              className="flex-1 py-2.5 rounded-xl bg-[#e3f6e1] text-[#1f7a1f] border-2 border-[#8bc98a] font-display font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              Sold
            </button>
            <button
              type="button"
              onClick={() => onNotSold(layer3Node.id)}
              className="flex-1 py-2.5 rounded-xl bg-[#fbe4e2] text-[#a13b36] border-2 border-[#e2534d] font-display font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              Not Sold
            </button>
          </div>
        )}
      </div>

      {/* Bottom half — all three layers, stacked, with the active one highlighted */}
      <div className="flex-1 p-5 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-header-purple/50 mb-1">How it works</p>

        <LayerRow
          number={1}
          text="Speedy Delivery; No discount"
          active={state.phase === 'layer1'}
          onSkip={state.phase === 'layer1' ? onSkipLayer : undefined}
          skipLabel="Not Sold? Move to Layer 2 →"
        />
        <LayerRow
          number={2}
          text="Flat 15% off at nearby Sort Centres"
          active={state.phase === 'layer2'}
          onSkip={state.phase === 'layer2' ? onSkipLayer : undefined}
          skipLabel="Not Sold? Move to Layer 3 →"
        />
        <LayerRow number={3} text="Discount proportional to remaining distance" active={state.phase === 'layer3'} />
      </div>
    </aside>
  )
}

function LayerRow({
  number,
  text,
  active,
  onSkip,
  skipLabel,
}: {
  number: 1 | 2 | 3
  text: string
  active: boolean
  onSkip?: () => void
  skipLabel?: string
}) {
  return (
    <div
      className={`rounded-xl px-3.5 py-3 border-2 transition-colors ${
        active ? 'bg-bg-beige border-highlight-orange' : 'bg-bg-beige/50 border-transparent'
      }`}
    >
      <p className={`text-[11px] font-extrabold uppercase tracking-wider mb-1 ${active ? 'text-highlight-orange' : 'text-header-purple/40'}`}>
        Layer {number}
      </p>
      <p className={`text-[13px] font-medium leading-relaxed ${active ? 'text-header-purple' : 'text-header-purple/50'}`}>
        {text}
      </p>
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 w-full py-2 rounded-lg bg-highlight-orange text-header-purple font-display font-bold text-xs shadow-glow transition-transform hover:scale-[1.02] active:scale-95"
        >
          {skipLabel}
        </button>
      )}
    </div>
  )
}

function ProductHeader() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 shrink-0 rounded-xl bg-bg-beige border border-header-purple/10 overflow-hidden">
        <img src="/product_image_earphones.avif" alt="Returned Wireless Earbuds" className="h-full w-full object-cover" />
      </div>
      <div>
        <h2 className="font-display font-bold text-header-purple text-sm leading-snug">Returned Wireless Earbuds</h2>
      </div>
    </div>
  )
}
