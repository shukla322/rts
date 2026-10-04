import type { ReactNode } from 'react'
import { cx } from './cx'

interface PhoneFrameProps {
  /** Outer width in px. */
  width?: number
  /** Visible screen height in px. The phone is cropped here and fades out, like it is peeking up from the bottom. */
  height?: number
  children: ReactNode
  className?: string
}

/**
 * A phone drawn as a wireframe: outline body, notch and status bar, with the
 * content as its screen. Cropped at the bottom so it stays compact in a side panel.
 */
export function PhoneFrame({ width = 176, height = 230, children, className }: PhoneFrameProps) {
  return (
    <div className={cx('relative shrink-0', className)} style={{ width }} aria-hidden>
      <div
        className="relative overflow-hidden rounded-t-[26px] border-[3px] border-b-0 border-header-purple bg-bg-white"
        style={{ height }}
      >
        {/* Status bar: time, notch, signal and battery */}
        <div className="relative flex items-center justify-between px-4 pt-1.5 text-caption font-bold text-header-purple">
          <span>9:41</span>
          <span className="absolute left-1/2 top-1.5 h-3.5 w-12 -translate-x-1/2 rounded-full bg-header-purple" />
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-px">
              {[4, 6, 8].map((h) => (
                <span key={h} className="w-[2px] rounded-sm bg-header-purple" style={{ height: h }} />
              ))}
            </span>
            <span className="h-2 w-3.5 rounded-[3px] border border-header-purple" />
          </span>
        </div>
        {children}
      </div>
      {/* Fade the cut-off edge into the panel behind */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-white to-transparent" />
    </div>
  )
}
