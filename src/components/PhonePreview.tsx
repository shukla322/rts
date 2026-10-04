import { inr } from '../utils/format'
import { PhoneFrame } from './ui'

interface Props {
  productName: string
  productImage: string
  /** The price the buyer sees right now. */
  price: number
  /** The undiscounted price, shown struck through when a discount applies. */
  listPrice?: number
  /** Discount as a fraction (0.15 = 15%), shown as a green chip. */
  discount?: number
  /** Delivery line under the price. Omit while no auction is running. */
  hint?: string
}

/**
 * "What the buyer sees": the product listing in a buyer's shopping app, at the
 * price the current auction layer is offering. Purely a preview, nothing in it is clickable.
 */
export default function PhonePreview({ productName, productImage, price, listPrice, discount = 0, hint }: Props) {
  return (
    <PhoneFrame>
      {/* App bar */}
      <div className="flex items-center justify-between px-3 py-1.5 text-caption font-bold text-header-purple/60">
        <span aria-hidden>‹</span>
        <span>Product</span>
        <span aria-hidden>♡</span>
      </div>

      <div className="px-3">
        <div className="h-[84px] overflow-hidden rounded-lg bg-bg-beige border border-header-purple/10">
          <img src={productImage} alt="" className="h-full w-full object-cover" />
        </div>

        <p className="mt-2 truncate text-body font-bold text-header-purple">{productName}</p>

        <div className="flex items-baseline gap-1.5">
          {/* Re-keyed on the price so it pops when the layer changes it */}
          <span key={price} className="animate-pop-in font-display text-xl font-extrabold text-num-red">
            {inr(price)}
          </span>
          {listPrice !== undefined && discount > 0 && (
            <span className="text-caption text-header-purple/45 line-through">{inr(listPrice)}</span>
          )}
          {discount > 0 && (
            <span className="rounded bg-[#e3f6e1] px-1 text-caption font-extrabold text-[#1f7a1f]">
              −{Math.round(discount * 100)}%
            </span>
          )}
        </div>

        {hint ? (
          <p className="text-caption font-semibold text-header-purple/70">{hint}</p>
        ) : (
          <span className="mt-1 block h-2 w-24 rounded-full bg-header-purple/10" />
        )}

        <div className="mt-2 rounded-lg bg-highlight-orange py-1.5 text-center text-caption font-extrabold text-header-purple">
          Buy now
        </div>
      </div>
    </PhoneFrame>
  )
}
