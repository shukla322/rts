import { Fragment, useMemo, useState } from 'react'
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

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'time' ? 'desc' : 'asc' }))

  const colCount = COLUMNS.length + 3

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-body font-semibold text-header-purple/70">
          {rows.length.toLocaleString('en-IN')} {rows.length === 1 ? 'return' : 'returns'}
        </p>
        <div className="flex gap-2">
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
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-body text-header-purple">
          <thead>
            <tr className="text-left text-caption uppercase tracking-wider text-header-purple/55">
              {COLUMNS.map((c) => {
                const active = sort.key === c.key
                return (
                  <th
                    key={c.key}
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={`py-1.5 pr-3 font-extrabold ${c.align === 'right' ? 'text-right' : ''}`}
                  >
                    <button type="button" onClick={() => toggleSort(c.key)} className="uppercase tracking-wider hover:text-header-purple">
                      {c.label}
                      {active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                )
              })}
              <th className="py-1.5 pr-3 font-extrabold">Boost reason</th>
              <th className="py-1.5 pr-3 font-extrabold" />
              <th className="py-1.5 font-extrabold" />
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, visible).map((run) => {
              const open = expanded === run.id
              return (
                <Fragment key={run.id}>
                  <tr className={`border-t border-header-purple/10 ${open ? 'bg-light-orange' : 'hover:bg-bg-beige/40'}`}>
                    <td className="py-1.5 pr-3 whitespace-nowrap text-header-purple/70">{relativeTime(run.createdAt)}</td>
                    <td className="py-1.5 pr-3 font-semibold">{getProduct(run.productId).name}</td>
                    <td className="py-1.5 pr-3">{getCategory(run.categoryId).name}</td>
                    <td className="py-1.5 pr-3">{getSeller(run.sellerId).name}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {getMajorNode(run.sscId as MajorNodeId).city} → {getMajorNode(run.dscId as MajorNodeId).city}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span className={`font-bold ${run.outcome === 'sold' ? 'text-[#1f7a1f]' : 'text-[#a13b36]'}`}>
                        {run.outcome === 'sold' ? 'Sold' : 'Unsold'}
                      </span>
                    </td>
                    <td className="py-1.5 pr-3">{run.soldLayer ? `L${run.soldLayer}` : '—'}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{run.pricePaid ? inr(run.pricePaid) : '—'}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {run.discountPct !== undefined ? pct(run.discountPct, 1) : '—'}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{run.avoided.km > 0 ? km(run.avoided.km) : '—'}</td>
                    <td className="py-1.5 pr-3">{run.boostReason ? <BoostBadge reason={run.boostReason} variant="short" /> : '—'}</td>
                    <td className="py-1.5 pr-3">
                      {run.source === 'live' && (
                        <Tag tone="accent">your run</Tag>
                      )}
                    </td>
                    <td className="py-1.5 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setExpanded(open ? null : run.id)}>
                        {open ? 'Hide trace' : 'Trace'}
                      </Button>
                      <Button size="sm" onClick={() => onReplay(run)}>
                        Replay
                      </Button>
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-light-orange">
                      <td colSpan={colCount} className="px-3 pb-3 pt-1">
                        <TraceTimeline trace={run.trace} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={colCount} className="py-6 text-center text-header-purple/55">
                  No returns match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > visible && (
        <Button variant="outline" full onClick={() => setVisible((v) => v + PAGE_SIZE)}>
          Show more ({rows.length - visible} remaining)
        </Button>
      )}
    </Card>
  )
}
