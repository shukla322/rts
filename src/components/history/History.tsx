import { useRunStore } from '../../state/runStore'
import type { RunRecord } from '../../data/types'
import { PageHeader, PageShell } from '../ui'
import ReturnsTable from './ReturnsTable'

interface Props {
  onReplay: (run: RunRecord) => void
}

/** Every return the system has handled, with its decision trace and a one-click replay. */
export default function History({ onReplay }: Props) {
  const { runs } = useRunStore()
  return (
    <PageShell>
      <PageHeader
        title="RTS History"
        subtitle="Every return handled by Return-to-Sale. Expand a row for its decision trace, or replay it on Home."
      />
      <ReturnsTable runs={runs} onReplay={onReplay} />
    </PageShell>
  )
}
