import { SELLERS } from '../../data/sellers'
import { useRunStore } from '../../state/runStore'
import { PageHeader, PageShell } from '../ui'
import SellerCard from './SellerCard'

export default function Sellers() {
  const { runs } = useRunStore()
  return (
    <PageShell>
      <PageHeader
        title="Sellers"
        subtitle="Contract terms and return performance for each seller. The resale discount cap applies to Layer 2 and Layer 3 pricing in the simulation."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {SELLERS.map((s) => (
          <SellerCard key={s.id} seller={s} runs={runs} />
        ))}
      </div>
    </PageShell>
  )
}
