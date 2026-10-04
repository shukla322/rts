import { ASSUMPTION_ROWS } from '../../data/assumptions'
import { CATEGORIES } from '../../data/catalog'
import { NODE_DEMAND } from '../../data/demand'
import { MAJOR_NODES } from '../../data/network'
import { Disclosure, Eyebrow } from '../ui'

/** Read-only list of every constant behind the numbers, plus the demand-profile table. */
export default function AssumptionsDrawer() {
  const groups = Array.from(new Set(ASSUMPTION_ROWS.map((r) => r.group)))

  return (
    <Disclosure variant="card" title="Assumptions" subtitle="Constants behind the numbers on this page">
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group} className="flex flex-col gap-1">
            <Eyebrow>{group}</Eyebrow>
            <dl className="flex flex-col">
              {ASSUMPTION_ROWS.filter((r) => r.group === group).map((r) => (
                <div
                  key={r.key}
                  className="flex flex-wrap items-baseline gap-x-3 border-t border-header-purple/10 py-1.5 text-body"
                >
                  <dt className="font-mono text-caption font-bold text-header-purple min-w-[11rem]">{r.key}</dt>
                  <dd className="font-display font-extrabold text-header-purple">{r.value}</dd>
                  <dd className="text-caption text-header-purple/60">{r.note}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <Eyebrow>Node demand profiles — cart overlap / order frequency, 0–1</Eyebrow>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-caption text-header-purple">
              <thead>
                <tr className="text-left text-header-purple/60">
                  <th className="py-1 pr-3 font-bold">Node</th>
                  <th className="py-1 pr-3 font-bold">Density</th>
                  {CATEGORIES.map((c) => (
                    <th key={c.id} className="py-1 pr-3 font-bold">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MAJOR_NODES.map((n) => (
                  <tr key={n.id} className="border-t border-header-purple/10">
                    <td className="py-1 pr-3 font-semibold">{n.city}</td>
                    <td className="py-1 pr-3 tabular-nums">{NODE_DEMAND[n.id].regionOrderDensity.toFixed(2)}</td>
                    {CATEGORIES.map((c) => {
                      const d = NODE_DEMAND[n.id].byCategory[c.id]
                      return (
                        <td key={c.id} className="py-1 pr-3 tabular-nums">
                          {d.cartOverlap.toFixed(2)} / {d.orderFrequency.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Disclosure>
  )
}
