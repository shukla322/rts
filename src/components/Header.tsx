import { Segmented } from './ui'

export type Tab = 'home' | 'dashboard' | 'history' | 'sellers'

const TABS: { value: Tab; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'history', label: 'RTS History' },
  { value: 'sellers', label: 'Sellers' },
]

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

/**
 * Top bar: logo at the left, title centred, screen navigation at the right.
 * Wide screens get a single slim row; phones and tablets drop the nav to a second row.
 */
export default function Header({ activeTab, onTabChange }: Props) {
  return (
    <header className="relative bg-header-purple text-bg-white px-4 py-1.5 lg:py-2 lg:px-6 shadow-card z-[1000] grid grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1">
      <img src="/products/meeshologo.png" alt="Meesho" className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg" />

      <h1 className="font-display font-bold text-base lg:text-xl leading-tight text-center">
        Return-to-sale (RTS) Prototype
      </h1>

      {/* Mirrors the logo's width on phones so the title stays centred; the nav takes its own row there. */}
      <span aria-hidden className="h-8 w-8 lg:hidden" />
      <Segmented
        tone="dark"
        size="sm"
        ariaLabel="Screens"
        options={TABS}
        value={activeTab}
        onChange={onTabChange}
        className="col-span-3 justify-self-center lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:justify-self-end"
      />
    </header>
  )
}
