import type { ButtonHTMLAttributes } from 'react'
import { cx } from './cx'

/**
 *  - primary: the main call to action (plum)
 *  - success: "Sold" (green)
 *  - danger:  "Not Sold" (red)
 *  - outline: secondary action
 *  - ghost:   quiet text button
 */
export type ButtonVariant = 'primary' | 'success' | 'danger' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'brand-button border border-header-purple',
  success: 'bg-[#e8f4ee] text-[#1f7a55] border border-[#1f7a55]/20',
  danger: 'bg-[#fbeceb] text-[#b23a3a] border border-num-red/20',
  outline: 'bg-bg-white text-header-purple border-2 border-header-purple/20 hover:bg-bg-beige',
  ghost: 'text-header-purple/60 hover:text-header-purple border-2 border-transparent',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-caption',
  md: 'px-4 py-2 text-body',
  lg: 'px-5 py-3 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  full?: boolean
}

export function Button({ variant = 'primary', size = 'md', full, className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'ui-button rounded-[9px] font-display font-bold transition-all active:scale-95 disabled:opacity-40',
        'hover:scale-[1.02] disabled:hover:scale-100',
        VARIANT[variant],
        // The glow ring is for full-size calls to action; small buttons (table rows) stay flat.
        variant === 'primary' && size !== 'sm' && 'shadow-card',
        SIZE[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    />
  )
}
