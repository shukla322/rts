import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cx } from './cx'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
  /** Visible label above the dropdown. Without it, pass aria-label. */
  label?: ReactNode
  /** Shown (and not selectable) while value is empty. */
  placeholder?: string
  options: SelectOption[]
  onChange: (value: string) => void
  size?: 'sm' | 'md'
}

/** The one dropdown, used for route pickers, filters and chart controls. */
export function Select({ label, placeholder, options, onChange, size = 'md', className, value, ...rest }: SelectProps) {
  const control = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        'w-full rounded-lg border border-header-purple/20 bg-bg-white font-semibold text-header-purple disabled:opacity-40',
        size === 'md' ? 'px-2.5 py-2 text-body' : 'px-2 py-1 text-caption',
        className,
      )}
      {...rest}
    >
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )

  if (!label) return control
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-body font-semibold text-header-purple/80">{label}</span>
      {control}
    </label>
  )
}
