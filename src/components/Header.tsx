import { Segmented } from './ui'

export type Tab = 'home' | 'history' | 'sellers'

const TABS: { value: Tab; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'history', label: 'RTS History' },
  { value: 'sellers', label: 'Sellers' },
]

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

/**
 * Top bar: brand and wordmark at the left, screen navigation at the right.
 * Wide screens get a single slim row; phones and tablets drop the nav to a second row.
 */
export default function Header({ activeTab, onTabChange }: Props) {
  const logoUrl = `${import.meta.env.BASE_URL}products/meeshologo.png`

  return (
    <header className="app-header relative z-[1000] flex flex-wrap items-center justify-between gap-4 px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <img src={logoUrl} alt="Meesho" className="h-10 w-10 rounded-xl" />
        <div className="wordmark">
          <p className="panel-eyebrow">Meesho &middot; Return-to-sale</p>
          <h1 className="font-display font-extrabold text-lg leading-tight">A new route to resale<span>.</span></h1>
        </div>
      </div>
      <nav aria-label="Main navigation" className="header-nav">
        <Segmented
          size="sm"
          ariaLabel="Screens"
          options={TABS}
          value={activeTab}
          onChange={onTabChange}
        />
      </nav>
    </header>
  )
}
