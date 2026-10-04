import { useMemo, useState } from 'react'
import { CATEGORIES, getCategory, getProduct } from '../../data/catalog'
import { getMajorNode, type MajorNodeId } from '../../data/network'
import { getSeller } from '../../data/sellers'
import { filterRuns, type LayerFilter } from '../../data/selectors'
import type { CategoryId, RunRecord } from '../../data/types'
import BoostBadge from '../BoostBadge'
import { inr, km, pct, relativeTime } from '../../utils/format'
import { Button, Card, Select, Tag } from '../ui'
import TraceTimeline from './TraceTimeline'

type SortKey = 'time' | 'product' | 'category' | 'seller' | 'route' | 'outcome' | 'layer' | 'price' | 'discount' | 'km'

interface Props {
  runs: RunRecord[]
  onReplay: (run: RunRecord) => void
}

const PAGE_SIZE = 25

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'time', label: 'Time' },
  { key: 'product', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'seller', label: 'Seller' },
  { key: 'route', label: 'SSC → DSC' },
  { key: 'outcome', label: 'Outcome' },
  { key: 'layer', label: 'Layer' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'discount', label: 'Discount', align: 'right' },
  { key: 'km', label: 'Km avoided', align: 'right' },
]

function sortValue(run: RunRecord, key: SortKey): string | number {
  switch (key) {
    case 'time':
      return run.createdAt
    case 'product':
      return getProduct(run.productId).name
    case 'category':
      return getCategory(run.categoryId).name
    case 'seller':
      return getSeller(run.sellerId).name
    case 'route':
      return `${getMajorNode(run.sscId as MajorNodeId).city} ${getMajorNode(run.dscId as MajorNodeId).city}`
    case 'outcome':
      return run.outcome
    case 'layer':
      return run.soldLayer ?? 4
    case 'price':
      return run.pricePaid ?? -1
    case 'discount':
      return run.discountPct ?? -1
    case 'km':
      return run.avoided.km
  }
}

export default function ReturnsTable({ runs, onReplay }: Props) {
  const [layerFilter, setLayerFilter] = useState<LayerFilter | undefined>(undefined)
  const onLayerFilterChange = setLayerFilter
  const [categoryId, setCategoryId] = useState<CategoryId | ''>('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'time', dir: 'desc' })
  const [expanded, setExpanded] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const rows = useMemo(() => {
    const filtered = filterRuns(runs, { layer: layerFilter, categoryId: categoryId || undefined })
    const sign = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = sortValue(a, sort.key)
      const vb = sortValue(b, sort.key)
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return cmp * sign
    })
  }, [runs, layerFilter, categoryId, sort])

  return (
    <div className="history-list">
      <Card className="history-toolbar">
        <p className="text-body font-semibold text-header-purple/70">
          {rows.length.toLocaleString('en-IN')} {rows.length === 1 ? 'return' : 'returns'}
        </p>
        <div className="history-filters">
          <Select
            size="sm"
            aria-label="Filter by category"
            value={categoryId}
            options={[{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.name }))]}
            onChange={(v) => {
              setCategoryId(v as CategoryId | '')
              setVisible(PAGE_SIZE)
            }}
          />
          <Select
            size="sm"
            aria-label="Filter by layer"
            value={layerFilter === undefined ? '' : String(layerFilter)}
            options={[
              { value: '', label: 'All outcomes' },
              { value: '1', label: 'Sold in Layer 1' },
              { value: '2', label: 'Sold in Layer 2' },
              { value: '3', label: 'Sold in Layer 3' },
              { value: 'unsold', label: 'Unsold' },
            ]}
            onChange={(v) => {
              onLayerFilterChange(v === '' ? undefined : v === 'unsold' ? 'unsold' : (Number(v) as 1 | 2 | 3))
              setVisible(PAGE_SIZE)
            }}
          />
          <Select
            size="sm"
            aria-label="Sort returns"
            value={sort.key}
            options={COLUMNS.map((column) => ({ value: column.key, label: `Sort: ${column.label}` }))}
            onChange={(key) => setSort({ key: key as SortKey, dir: key === 'time' ? 'desc' : 'asc' })}
          />
          <Button variant="outline" size="sm" aria-label={`Sort ${sort.dir === 'asc' ? 'descending' : 'ascending'}`}
            onClick={() => setSort((current) => ({ ...current, dir: current.dir === 'asc' ? 'desc' : 'asc' }))}>
            {sort.dir === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>
      </Card>

      <div className="return-grid">
        {rows.slice(0, visible).map((run) => {
          const open = expanded === run.id
          const product = getProduct(run.productId)
          return (
            <Card key={run.id} className={`return-card ${open ? 'is-expanded' : ''}`}>
              <div className="return-card-heading">
                <img src={product.image} alt="" className="return-product-image" />
                <div className="min-w-0 flex-1">
                  <p className="record-eyebrow">{getCategory(run.categoryId).name}</p>
                  <h3>{product.name}</h3>
                  <p className="record-secondary">{getSeller(run.sellerId).name}</p>
                </div>
                <Tag tone={run.outcome === 'sold' ? 'success' : 'danger'}>{run.outcome === 'sold' ? 'Sold' : 'Unsold'}</Tag>
              </div>
              <div className="return-route" aria-label="Return route">
                <div><span>Source</span><strong>{getMajorNode(run.sscId as MajorNodeId).city}</strong></div>
                <span className="route-arrow" aria-hidden="true">&rarr;</span>
                <div><span>Destination</span><strong>{getMajorNode(run.dscId as MajorNodeId).city}</strong></div>
              </div>
              <dl className="return-metrics">
                <div><dt>Resale price</dt><dd>{run.pricePaid !== undefined ? inr(run.pricePaid) : '\u2014'}</dd></div>
                <div><dt>Discount</dt><dd>{run.discountPct !== undefined ? pct(run.discountPct, 1) : '\u2014'}</dd></div>
                <div><dt>Km avoided</dt><dd>{run.avoided.km > 0 ? km(run.avoided.km) : '\u2014'}</dd></div>
              </dl>
              <div className="return-context">
                <span className="record-secondary">{relativeTime(run.createdAt)}</span>
                {run.soldLayer && <Tag>Layer {run.soldLayer}</Tag>}
                {run.boostReason && <BoostBadge reason={run.boostReason} variant="short" />}
                {run.source === 'live' && <Tag tone="accent">Your run</Tag>}
              </div>
              <div className="return-actions">
                <Button variant="outline" size="sm" aria-expanded={open} aria-controls={`trace-${run.id}`} onClick={() => setExpanded(open ? null : run.id)}>
                  {open ? 'Hide trace' : 'View trace'}
                </Button>
                <Button size="sm" aria-label={`Replay ${product.name} return`} onClick={() => onReplay(run)}>Replay return &rarr;</Button>
              </div>
              {open && <section id={`trace-${run.id}`} aria-label="Decision trace" className="return-trace"><TraceTimeline trace={run.trace} /></section>}
            </Card>
          )
        })}
      </div>
      {rows.length === 0 && <Card className="history-empty"><h3>No matching returns</h3><p>Try another category or outcome to see more returns.</p></Card>}

      {rows.length > visible && (
        <Button variant="outline" full onClick={() => setVisible((v) => v + PAGE_SIZE)}>
          Show more ({rows.length - visible} remaining)
        </Button>
      )}
    </div>
  )
}
