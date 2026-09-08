import { AnimatePresence, motion } from 'framer-motion'
import type { SimStatus } from '../state/useSimulation'
import { getPricingForNode, type PricingConfig } from '../data/pricing'
import type { HubNode } from '../data/nodes'

interface Props {
  status: SimStatus
  auctionIndex: number | null
  lastIndex: number
  pricingConfig: PricingConfig
  node: HubNode | null
  onReset: () => void
}

export default function EndScreen({ status, auctionIndex, lastIndex, pricingConfig, node, onReset }: Props) {
  const open = status === 'bought' || status === 'unsold'
  const pricing =
    status === 'bought' && auctionIndex !== null
      ? getPricingForNode(auctionIndex, lastIndex, pricingConfig)
      : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-header-purple/50 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm bg-bg-white rounded-3xl shadow-card px-6 py-8 text-center"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-bg-beige flex items-center justify-center text-3xl">
              {status === 'bought' ? '✅' : '↩️'}
            </div>
            <h2 className="mt-4 font-display font-bold text-lg text-header-purple">
              {status === 'bought'
                ? `Someone in ${node?.city ?? 'transit'} bought the product`
                : 'Return Completed'}
            </h2>
            <p className="mt-2 text-sm text-header-purple/70">
              {status === 'bought'
                ? 'To be delivered in 2 days.'
                : 'No buyer along the way — the item has been sent back to origin, unsold.'}
            </p>
            {pricing && (
              <p className="mt-2 text-sm font-bold text-highlight-orange">
                Valmo saves {pricing.operatorSavingsPercent.toFixed(0)}% (₹
                {pricing.operatorSavings.toFixed(0)}) off the original Reverse Logistics Costs.
              </p>
            )}
            <button
              onClick={onReset}
              className="mt-6 w-full py-3 rounded-xl bg-highlight-orange text-header-purple font-display font-bold text-sm shadow-glow transition-transform hover:scale-[1.02] active:scale-95"
            >
              Reset Simulation
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
