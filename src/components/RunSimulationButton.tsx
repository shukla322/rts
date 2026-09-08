interface Props {
  visible: boolean
  onRun: () => void
}

// Opacity/pointer-events toggle (not display) so the button's disappearance
// never shifts surrounding header content.
export default function RunSimulationButton({ visible, onRun }: Props) {
  return (
    <button
      onClick={onRun}
      disabled={!visible}
      aria-hidden={!visible}
      className={`px-6 py-2.5 rounded-full bg-highlight-orange text-header-purple font-display font-bold text-sm tracking-wide shadow-glow transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      ▶ Run Simulation
    </button>
  )
}
