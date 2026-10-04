import type { TraceStep } from '../../data/types'

const EVENT_STYLE: Record<TraceStep['event'], { dot: string; label: string }> = {
  qualified: { dot: '#d6409f', label: 'Qualified' },
  bid: { dot: '#fd9b08', label: 'Bid' },
  declined: { dot: '#ef4a59', label: 'Declined' },
  bought: { dot: '#3f9a3e', label: 'Bought' },
  skipped: { dot: '#9a8f86', label: 'Skipped' },
}

/** Readable decision trace: one entry per step, grouped by layer. */
export default function TraceTimeline({ trace }: { trace: TraceStep[] }) {
  return (
    <ol className="flex flex-col gap-0.5">
      {trace.map((step, i) => {
        const startsLayer = i === 0 || trace[i - 1].layer !== step.layer
        const style = EVENT_STYLE[step.event]
        return (
          <li key={i} className="flex gap-2.5">
            <span className="w-14 shrink-0 pt-0.5 text-caption font-extrabold uppercase tracking-wider text-header-purple/55">
              {startsLayer ? `Layer ${step.layer}` : ''}
            </span>
            <span className="relative flex flex-col items-center">
              <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: style.dot }} aria-hidden />
              {i < trace.length - 1 && <span className="w-px flex-1 bg-header-purple/15" aria-hidden />}
            </span>
            <p className="pb-1.5 text-body leading-snug text-header-purple/85">
              <b className="text-header-purple">{style.label}.</b> {step.note}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
