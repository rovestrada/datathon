import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Download, Filter } from 'lucide-react'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril']

const TRANSACTIONS = [
  {
    id: 1, date: '25 abr', desc: 'Ahorro inmediato', amount: +0.08,
    type: 'rendimiento', icon: '📈',
  },
  {
    id: 2, date: '24 abr', desc: 'Ingreso inicial', amount: +96.84,
    type: 'abono', icon: '💰',
  },
  {
    id: 3, date: '22 abr', desc: 'Referido activo', amount: 0,
    type: 'neutro', icon: '👥',
  },
]

export default function MobileStatement({ onBack, onOpenHAVI }) {
  const [month, setMonth] = useState('Abril')
  const [filterOpen, setFilterOpen] = useState(false)

  const total = TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: '#0a0a12', overflowY: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#0d1022', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid #1a1a2a', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '22px', padding: '4px' }}>‹</button>
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'white', flex: 1 }}>Estado de Cuenta</h1>
        <button
          onClick={() => setFilterOpen(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
        >
          <Filter size={18} />
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
          <Download size={18} />
        </button>
      </div>

      {/* Month selector */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 20px', overflowX: 'auto' }}>
        {MONTHS.map(m => (
          <button
            key={m}
            onClick={() => setMonth(m)}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: month === m ? '#a78bfa' : '#1a1a2a',
              color: month === m ? 'white' : '#9ca3af',
              fontSize: '13px', fontWeight: month === m ? 700 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ margin: '0 20px 20px', background: '#1a1a2a', borderRadius: '14px', padding: '16px', border: '1px solid #2a2a3a' }}>
        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280' }}>Cuenta HEY – *001-5 · {month} 2026</p>
        <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#4db6e8' }}>
          ${total.toFixed(2)} MXN
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#555' }}>Saldo total del período</p>
      </div>

      {/* Transactions */}
      <div style={{ padding: '0 20px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Movimientos
        </p>

        {TRANSACTIONS.length === 0 ? (
          <div style={{ background: '#1a1a2a', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#555' }}>
            <p style={{ margin: 0 }}>Sin movimientos en {month}</p>
          </div>
        ) : (
          TRANSACTIONS.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                background: '#1a1a2a', borderRadius: '12px', padding: '14px 16px',
                marginBottom: '10px', border: '1px solid #2a2a3a',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}
            >
              <span style={{ fontSize: '22px' }}>{tx.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'white' }}>{tx.desc}</p>
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#555' }}>{tx.date} 2026</p>
              </div>
              <p style={{
                margin: 0, fontSize: '14px', fontWeight: 700,
                color: tx.amount > 0 ? '#4ade80' : tx.amount < 0 ? '#ef4444' : '#6b7280',
              }}>
                {tx.amount === 0 ? '—' : `${tx.amount > 0 ? '+' : ''}$${Math.abs(tx.amount).toFixed(2)}`}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* HAVI tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onOpenHAVI}
        style={{
          margin: '16px 20px 100px',
          background: '#1e1040', border: '1px solid #a78bfa44',
          borderRadius: '14px', padding: '16px',
          display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '20px' }}>🏛</span>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#a78bfa', fontWeight: 600, letterSpacing: '0.5px' }}>HAVI analiza</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#e5e7eb', lineHeight: 1.5 }}>
            Tu cuenta no registra gastos este mes. ¡Excelente! Considera mover parte de tu saldo a ahorro inmediato para generar más rendimiento.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
