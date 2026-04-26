import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Reusable dashboard card with hover effects.
 * @param {string} title - Card heading
 * @param {React.ReactNode} children - Card body content
 * @param {string} [className] - Extra classes
 * @param {boolean} [accent] - Show green accent top-border
 */
export default function Card({ title, children, className, accent = false }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,255,136,0.08)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={clsx(
        'rounded-2xl p-5 flex flex-col gap-3',
        className
      )}
      style={{
        background: '#111',
        border: accent ? '1px solid #00ff8844' : '1px solid #222',
        borderTop: accent ? '2px solid #00ff88' : undefined,
      }}
    >
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#666' }}>
          {title}
        </h3>
      )}
      {children}
    </motion.div>
  )
}
