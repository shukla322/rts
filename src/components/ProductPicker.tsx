import { useEffect, useState } from 'react'
import { CATEGORIES, getProduct, PRODUCTS } from '../data/catalog'
import { getSeller } from '../data/sellers'
import type { CategoryId, Product } from '../data/types'
import { inr } from '../utils/format'
import { Chip, cx } from './ui'

interface Props {
  productId: string
  /** Product choice is locked once a run is under way — use Reset. */
  disabled: boolean
  onSelect: (productId: string) => void
}

export default function ProductPicker({ productId, disabled, onSelect }: Props) {
  const selected = getProduct(productId)
  const [categoryId, setCategoryId] = useState<CategoryId>(selected.categoryId)

  // Follow external changes (e.g. a History replay switching product).
  useEffect(() => setCategoryId(selected.categoryId), [selected.categoryId])

  if (disabled) return <ProductRow product={selected} selected />

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Product category">
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            role="tab"
            aria-selected={c.id === categoryId}
            active={c.id === categoryId}
            onClick={() => {
              setCategoryId(c.id)
              // Keep the selection inside the visible category.
              if (selected.categoryId !== c.id) onSelect(PRODUCTS.find((p) => p.categoryId === c.id)!.id)
            }}
          >
            {c.name}
          </Chip>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {PRODUCTS.filter((p) => p.categoryId === categoryId).map((p) => (
          <ProductRow key={p.id} product={p} selected={p.id === productId} onClick={() => onSelect(p.id)} />
        ))}
      </div>
    </div>
  )
}

/** One product: photo, name, seller, price. A button when it can be chosen, static when locked. */
function ProductRow({ product, selected, onClick }: { product: Product; selected?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover bg-bg-beige" />
      <span className="min-w-0 flex-1">
        <span className="block text-body font-bold text-header-purple leading-snug">{product.name}</span>
        <span className="block text-caption font-medium text-header-purple/60 truncate">
          {getSeller(product.sellerId).name}
        </span>
      </span>
      <span className="font-display text-body font-extrabold text-header-purple">{inr(product.price)}</span>
    </>
  )
  const row = cx(
    'flex items-center gap-3 rounded-xl border-2 px-2.5 py-2 text-left transition-colors w-full',
    selected ? 'border-highlight-orange bg-light-orange' : 'border-transparent bg-bg-beige/50 hover:bg-bg-beige',
  )

  if (!onClick) return <div className={row}>{body}</div>
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={row}>
      {body}
    </button>
  )
}
