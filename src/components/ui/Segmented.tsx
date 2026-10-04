import { cx } from './cx'

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  /** dark: on the purple header. light: on the page / map. */
  tone?: 'dark' | 'light'
  size?: 'sm' | 'md'
  className?: string
}

/** Pill-shaped switch between a few options: the header navigation and the map's camera mode. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  tone = 'light',
  size = 'md',
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx('flex gap-1 rounded-full p-1', tone === 'dark' ? 'bg-white/10' : 'bg-bg-white shadow-card', className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'whitespace-nowrap rounded-full text-body font-bold transition-colors',
              size === 'sm' ? 'px-3 py-1' : 'px-3 sm:px-3.5 py-1.5',
              active
                ? 'bg-highlight-orange text-header-purple'
                : tone === 'dark'
                  ? 'text-bg-white/75 hover:text-bg-white'
                  : 'text-header-purple/50 hover:text-header-purple',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
