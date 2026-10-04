import { motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { cx } from './cx'

interface ModalProps {
  /** Accessible name of the dialog. */
  label: string
  /** Called on Escape and on a click outside the panel. Omit for a dialog that must be answered. */
  onClose?: () => void
  /** sheet: bottom sheet on phones, centred card on desktop. center: always a centred card. */
  placement?: 'sheet' | 'center'
  className?: string
  children: ReactNode
}

/** The one dialog shell used by the node stats popup and the end-of-run summary. Wrap in AnimatePresence for exit animation. */
export function Modal({ label, onClose, placement = 'sheet', className, children }: ModalProps) {
  useEffect(() => {
    if (!onClose) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sheet = placement === 'sheet'

  return (
    <motion.div
      className={cx(
        'fixed inset-0 z-[2000] flex justify-center bg-header-purple/40 backdrop-blur-[2px] overflow-y-auto px-4',
        sheet ? 'items-end md:items-center px-0 md:px-4' : 'items-center',
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className={cx(
          'w-full bg-bg-white shadow-card px-5 py-5 my-4',
          sheet ? 'md:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl md:rounded-3xl my-0 md:my-4' : 'max-w-sm rounded-3xl',
          className,
        )}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
