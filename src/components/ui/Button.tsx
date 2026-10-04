import type { ButtonHTMLAttributes } from 'react'
import { cx } from './cx'

/**
 *  - primary: the main call to action (orange)
 *  - success: "Sold" (green)
 *  - danger:  "Not Sold" (red)
 *  - outline: secondary action
 *  - ghost:   quiet text button
 */
export type ButtonVariant = 'primary' | 'success' | 'danger' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-highlight-orange text-header-purple border-2 border-highlight-orange',
  success: 'bg-[#e3f6e1] text-[#1f7a1f] border-2 border-[#8bc98a]',
  danger: 'bg-[#fbe4e2] text-[#a13b36] border-2 border-num-red',
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
        'rounded-lg font-display font-bold transition-transform active:scale-95 disabled:opacity-40',
        'hover:scale-[1.02] disabled:hover:scale-100',
        VARIANT[variant],
        // The glow ring is for full-size calls to action; small buttons (table rows) stay flat.
        variant === 'primary' && size !== 'sm' && 'shadow-glow',
        SIZE[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    />
  )
}
