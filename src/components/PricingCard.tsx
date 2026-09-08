import { getPricingForNode, type PricingConfig } from '../data/pricing'
import type { HubNode } from '../data/nodes'

interface Props {
  node: HubNode | null
  nodeIndex: number | null
  lastIndex: number
  pricingConfig: PricingConfig
  auctionLive: boolean
  onSold: () => void
  onNotSold: () => void
}

export default function PricingCard({
  node,
  nodeIndex,
  lastIndex,
  pricingConfig,
  auctionLive,
  onSold,
  onNotSold,
}: Props) {
  const pricing = nodeIndex !== null ? getPricingForNode(nodeIndex, lastIndex, pricingConfig) : null

  return (
    <aside className="w-[340px] shrink-0 h-full overflow-y-auto bg-bg-white border-r border-header-purple/10 flex flex-col">
      {/* Top half — product info */}
      <div className="flex-1 p-5 border-b border-header-purple/10 flex flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-header-purple/50 mb-3">
          {node ? `Return auction · ${node.name}` : 'Live auction'}
        </p>

        {node && pricing ? (
          <>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-xl bg-bg-beige border border-header-purple/10 overflow-hidden">
                <img
                  src="/product_image_earphones.avif"
                  alt="Returned Wireless Earbuds"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h2 className="font-display font-bold text-header-purple text-sm leading-snug">
                  Returned Wireless Earbuds
                </h2>
                <p className="text-xs text-header-purple/60 mt-0.5">{node.city}</p>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-sm text-header-purple/45 line-through">₹{pricingConfig.totalPrice}</span>
              <span className="text-2xl font-display font-extrabold text-highlight-orange">
                ₹{pricing.discountedPrice.toFixed(0)}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-header-purple/60">Delivery Time: 2–3 days</p>
          </>
        ) : (
          <p className="text-sm text-header-purple/50 mt-6 text-center">
            Run the simulation to see live pricing.
          </p>
        )}

        {auctionLive && node && pricing && (
          <div className="mt-auto pt-4 flex gap-2">
            <button
              type="button"
              onClick={onSold}
              className="flex-1 py-2.5 rounded-xl bg-[#e3f6e1] text-[#1f7a1f] border-2 border-[#8bc98a] font-display font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              Sold
            </button>
            <button
              type="button"
              onClick={onNotSold}
              className="flex-1 py-2.5 rounded-xl bg-[#fbe4e2] text-[#a13b36] border-2 border-[#e2534d] font-display font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              Not Sold
            </button>
          </div>
        )}
      </div>

      {/* Bottom half — pricing strategy explainer */}
      <div className="flex-1 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-header-purple/50 mb-3">
          Discount Pricing Logic
        </p>
        <div className="rounded-xl bg-bg-beige px-3.5 py-3 text-[13px] text-header-purple/80 font-medium leading-relaxed">
          discount = margin * avoided_cost
          <br />
          avoided_cost = remaining_edges * n_edges
        </div>

        {pricing ? (
          <div className="mt-3 space-y-1.5 text-[13px] text-header-purple/70">
            <p>
              Remaining hops to origin: <b className="text-header-purple">{pricing.remainingEdges}</b>
            </p>
            <p>
              Avoided travel cost: {pricing.remainingEdges} × ₹{pricingConfig.costPerEdge} ={' '}
              <b className="text-header-purple">₹{pricing.avoidedTravelCost.toFixed(0)}</b>
            </p>
            <p>
              Discount: {pricingConfig.margin} × ₹{pricing.avoidedTravelCost.toFixed(0)} ={' '}
              <b className="text-header-purple">₹{pricing.discount.toFixed(0)}</b>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-header-purple/50">
            Numbers plug in once an auction is live.
          </p>
        )}
      </div>
    </aside>
  )
}
