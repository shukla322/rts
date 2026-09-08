import RunSimulationButton from './RunSimulationButton'

interface Props {
  simulationVisible: boolean
  onRunSimulation: () => void
}

export default function Header({ simulationVisible, onRunSimulation }: Props) {
  return (
    <header className="relative bg-header-purple text-bg-white px-6 py-4 flex items-center justify-end shadow-card z-[1000]">
      <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-bold text-2xl leading-tight">
        Return Trip Sale
      </h1>
      <RunSimulationButton visible={simulationVisible} onRun={onRunSimulation} />
    </header>
  )
}
