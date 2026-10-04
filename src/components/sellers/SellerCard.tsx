import { useMemo } from 'react'
import { PRODUCTS } from '../../data/catalog'
import { sellerStats } from '../../data/selectors'
import type { RunRecord, Seller } from '../../data/types'
import { inr, pct } from '../../utils/format'
import { Card, Eyebrow, Stat } from '../ui'

// Steps of the theme's magenta / orange family for the return-reason bar.
const MIX_COLORS = ['#9b2f78', '#d97f0f', '#119b85', '#6f4a65', '#cdbfcb']

export default function SellerCard({ seller, runs }: { seller: Seller; runs: RunRecord[] }) {
  const stats = useMemo(() => sellerStats(runs, seller.id), [runs, seller.id])
  const products = PRODUCTS.filter((p) => p.sellerId === seller.id)
  const mix = Object.entries(seller.returnReasonMix)
  const c = seller.contract

  return (
    <Card className="seller-card">
      <header className="seller-heading">
        <div className="min-w-0">
          <h3 className="font-display font-extrabold text-base text-header-purple leading-snug">{seller.name}</h3>
          <p className="text-caption text-header-purple/60">
            {products.map((p) => `${p.name} (${inr(p.price)})`).join(' · ')}
          </p>
        </div>
        <div className="seller-rating">
          <p className="font-display font-extrabold text-header-purple">★ {seller.rating.toFixed(1)}</p>
          <p className="text-caption text-header-purple/60">{seller.reviewCount.toLocaleString('en-IN')} reviews</p>
        </div>
      </header>

      <div className="seller-metrics grid grid-cols-3 gap-2">
        <Stat size="sm" label="Returns" value={String(stats.returnsHandled)} />
        <Stat size="sm" label="Resale rate" value={pct(stats.resaleRate)} />
        <Stat size="sm" label="Avg discount" value={stats.avgDiscountPct === null ? '—' : pct(stats.avgDiscountPct, 1)} />
      </div>

      <div className="seller-reasons flex flex-col gap-2">
        <Eyebrow>Return reasons · RTO rate {pct(seller.rtoRate)}</Eyebrow>
        <div className="flex h-2.5 gap-[2px]" role="img" aria-label="Return reason mix">
          {mix.map(([reason, share], i) => (
            <div
              key={reason}
              title={`${reason}: ${pct(share)}`}
              className="h-full rounded-[3px] first:rounded-l-full last:rounded-r-full"
              style={{ flex: share, background: MIX_COLORS[i % MIX_COLORS.length] }}
            />
          ))}
        </div>
        <ul className="seller-reason-legend">
          {mix.map(([reason, share], i) => (
            <li key={reason} className="flex items-center gap-1.5 text-caption text-header-purple/70">
              <span className="h-2 w-2 rounded-sm" style={{ background: MIX_COLORS[i % MIX_COLORS.length] }} aria-hidden />
              <span className="flex-1">{reason}</span><strong>{pct(share)}</strong>
            </li>
          ))}
        </ul>
      </div>

      <Card pad="sm" className="seller-contract flex flex-col gap-2">
        <Eyebrow>Contract</Eyebrow>
        <dl className="contract-details text-body text-header-purple">
          <dt className="text-header-purple/60">Signed</dt>
          <dd className="font-semibold">{c.signedOn}</dd>
          <dt className="text-header-purple/60">Term</dt>
          <dd className="font-semibold">{c.termMonths} months</dd>
          <dt className="text-header-purple/60">Return window</dt>
          <dd className="font-semibold">{c.returnWindowDays} days</dd>
          <dt className="text-header-purple/60">Resale discount cap</dt>
          <dd className="font-display font-extrabold text-header-purple">{pct(c.resaleDiscountCap)}</dd>
        </dl>
        <p className="text-caption text-header-purple/60">
          Caps Layer 2 and Layer 3 discounts for this seller&apos;s products in the simulation.
        </p>
      </Card>

      <div className="seller-reviews flex flex-col gap-2">
        <Eyebrow>Reviews</Eyebrow>
        <ul className="flex flex-col gap-1">
          {seller.reviews.map((r, i) => (
            <li key={i} className="seller-review text-body text-header-purple/80">
              <span className="text-highlight-orange" aria-label={`${r.stars} stars`}>
                {'★'.repeat(r.stars)}
                <span className="text-header-purple/20">{'★'.repeat(5 - r.stars)}</span>
              </span>{' '}
              {r.text}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
