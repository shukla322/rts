import { useEffect, useRef, type ReactNode } from 'react'
import { getLmdhsForMajor, getMajorNode, majorToHubNode } from '../data/network'
import { getProduct } from '../data/catalog'
import { getSeller } from '../data/sellers'
import {
  effectiveLayer2Discount,
  getLayer2Price,
  getPricingForNode,
  isLayer2Capped,
  type PricingConfig,
} from '../data/pricing'
import type { BoughtNode, SimState } from '../state/useSimulation'
import { useElementWidth } from '../hooks/useElementWidth'
import Layer2Bidders from './Layer2Bidders'
import PhonePreview from './PhonePreview'
import { Button, Card, Eyebrow, Notice, cx } from './ui'

interface Props {
  state: SimState
  pricingConfig: PricingConfig
  productId: string
  onBuy: (node: BoughtNode) => void
  onNotSold: (id: string) => void
  onSkipLayer: () => void
}

/** Right panel: the live auction. Product and price on top, the three layers below, all Sold / Not Sold actions here. */
export default function PricingCard({ state, pricingConfig, productId, onBuy, onNotSold, onSkipLayer }: Props) {
  const dscCity = state.dscId ? getMajorNode(state.dscId).city : null
  const product = getProduct(productId)
  const seller = getSeller(product.sellerId)
  const cap = seller.contract.resaleDiscountCap
  const l2Discount = effectiveLayer2Discount(cap)
  const capNote = `Discount capped at ${Math.round(cap * 100)}% by seller contract (${seller.name})`

  const layer3PathNodes = state.layer3Path.map((id) => majorToHubNode(getMajorNode(id)))
  const layer3Node = state.auctionIndex !== null ? layer3PathNodes[state.auctionIndex] : null
  const layer3Pricing =
    state.phase === 'layer3' && state.auctionIndex !== null
      ? getPricingForNode(state.auctionIndex, layer3PathNodes.length - 1, pricingConfig, cap)
      : null

  // Layer 1 has a single Sold button: it sells to the first hub still bidding.
  const layer1Hub =
    state.phase === 'layer1' && state.dscId
      ? getLmdhsForMajor(state.dscId).magenta.find((h) => h.id === state.layer1Pending[0])
      : undefined

  // What the buyer's phone shows right now, per auction layer.
  const idle = state.phase === 'select-ssc' || state.phase === 'select-dsc'
  const listing: { price: number; listPrice?: number; discount: number; hint?: string; notice?: string } = {
    price: pricingConfig.totalPrice,
    discount: 0,
  }
  if (state.phase === 'layer1') {
    listing.hint = 'Delivery within 2 days'
  } else if (state.phase === 'layer2') {
    listing.price = getLayer2Price(pricingConfig, cap)
    listing.listPrice = pricingConfig.totalPrice
    listing.discount = l2Discount
    listing.hint = 'Delivery within 2–3 days'
    if (isLayer2Capped(cap)) listing.notice = capNote
  } else if (state.phase === 'layer3' && layer3Pricing) {
    listing.price = layer3Pricing.discountedPrice
    listing.listPrice = pricingConfig.totalPrice
    listing.discount = layer3Pricing.percentSaved / 100
    listing.hint = 'Delivery Time: 2–3 days'
    if (layer3Pricing.capped) listing.notice = capNote
  }

  // Phone sits beside the details when this panel is wide enough (tablet widths stack it).
  const [topRef, topWidth] = useElementWidth<HTMLDivElement>()
  const wide = topWidth >= 340

  const headline =
    state.phase === 'layer1'
      ? `Return auction · ${dscCity} LMDH network`
      : state.phase === 'layer2'
        ? 'Return auction · Nation-wide boosting'
        : state.phase === 'layer3' && layer3Node
          ? `Return auction · ${layer3Node.city}`
          : 'Live auction'

  const sell = (node: { id: string; city: string; lat: number; lng: number }) =>
    onBuy({ id: node.id, city: node.city, lat: node.lat, lng: node.lng })

  return (
    <aside className="auction-panel w-full md:w-[30vw] shrink-0 md:h-full overflow-visible md:overflow-y-auto bg-bg-white border-b md:border-b-0 md:border-l border-header-purple/10 flex flex-col">
      {/* The parcel: what is being sold, and what the buyer sees at the current price */}
      <div className="p-5 border-b border-header-purple/10 flex flex-col gap-3">
        <Eyebrow>{headline}</Eyebrow>

        {/* Phone beside the details when the panel is wide enough, stacked above them when it is not */}
        <div ref={topRef} className={cx('flex gap-4', wide ? 'flex-row items-start' : 'flex-col items-center')}>
          <PhonePreview
            productName={product.name}
            productImage={product.image}
            price={listing.price}
            listPrice={listing.listPrice}
            discount={listing.discount}
            hint={listing.hint}
          />

          <div className="min-w-0 flex flex-col gap-2 self-stretch">
            <h2 className="font-display font-bold text-header-purple text-sm leading-snug">Returned {product.name}</h2>
            <p className="text-caption font-medium text-header-purple/60 leading-snug">
              {seller.name} · resale discount cap {Math.round(cap * 100)}%
            </p>
            {listing.notice && <Notice>{listing.notice}</Notice>}
            {idle ? (
              <p className="text-body text-header-purple/50">Choose a source and destination to begin.</p>
            ) : (
              <p className="text-caption text-header-purple/50">What the buyer sees at this stage.</p>
            )}
          </div>
        </div>
      </div>

      {/* The three layers, with the live one highlighted */}
      <div className="p-5 flex flex-col gap-3">
        <Eyebrow>How it works</Eyebrow>

        <LayerCard
          number={1}
          text="Speedy Delivery; No discount"
          active={state.phase === 'layer1'}
          onSkip={state.phase === 'layer1' ? onSkipLayer : undefined}
          skipLabel="Not Sold? Move to Layer 2 →"
          action={
            layer1Hub ? (
              <Button variant="success" size="sm" className="px-5" onClick={() => sell(layer1Hub)}>
                Sold
              </Button>
            ) : undefined
          }
        />

        <LayerCard
          number={2}
          text={`Flat ${(l2Discount * 100).toFixed(0)}% off at nearby Sort Centres`}
          active={state.phase === 'layer2'}
          onSkip={state.phase === 'layer2' ? onSkipLayer : undefined}
          skipLabel="Not Sold? Move to Layer 3 →"
        >
          <Layer2Bidders
            state={state}
            categoryId={product.categoryId}
            onSold={(id) => sell(getMajorNode(id))}
          />
        </LayerCard>

        <LayerCard number={3} text="Discount proportional to remaining distance" active={state.phase === 'layer3'}>
          {state.phase === 'layer3' && layer3Node && (
            <div className="flex flex-col gap-1.5">
              <p className="text-caption font-bold text-header-purple/70">
                Offered at <span className="text-header-purple">{layer3Node.city}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="success" className="flex-1" onClick={() => sell(layer3Node)}>
                  Sold
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => onNotSold(layer3Node.id)}>
                  Not Sold
                </Button>
              </div>
            </div>
          )}
        </LayerCard>
      </div>
    </aside>
  )
}

/**
 * One layer of the auction. The live layer is highlighted; the others are muted.
 * `action` sits at the right of the title line, `children` below it, and `onSkip`
 * adds the "move to the next layer" button at the bottom.
 */
function LayerCard({
  number,
  text,
  active,
  onSkip,
  skipLabel,
  action,
  children,
}: {
  number: 1 | 2 | 3
  text: string
  active: boolean
  onSkip?: () => void
  skipLabel?: string
  action?: ReactNode
  children?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Keep the live layer (and its Sold buttons) in view in the scrolling side panel.
  // Phones scroll the whole page instead, so leave that alone there.
  useEffect(() => {
    if (active && window.matchMedia('(min-width: 768px)').matches) {
      ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [active])

  return (
    <Card ref={ref} tone={active ? 'highlight' : 'muted'} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={cx('text-caption font-extrabold uppercase tracking-wider', active ? 'text-highlight-orange' : 'text-header-purple/40')}>
            Layer {number}
          </p>
          <p className={cx('text-body font-medium', active ? 'text-header-purple' : 'text-header-purple/50')}>{text}</p>
        </div>
        {action}
      </div>
      {children}
      {onSkip && (
        <Button full onClick={onSkip}>
          {skipLabel}
        </Button>
      )}
    </Card>
  )
}
