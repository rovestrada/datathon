import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Download, Filter } from 'lucide-react'
import { useScreen } from '../../context/ScreenContext'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril']

export default function MobileStatement({ onBack, onOpenHAVI }) {
  const { screenCache } = useScreen()
  const [month, setMonth] = useState('Abril')
  const [filterOpen, setFilterOpen] = useState(false)

  // Datos reales desde el contexto (usamos home como fuente de movimientos recientes)
  const homeData = screenCache.home?.data || {}
  const rawTx = homeData.movimientos_recientes || []
  
  const TRANSACTIONS = rawTx.map((t, i) => ({
    id: i,
    date: t.fecha,
    desc: t.comercio,
    amount: t.monto,
    type: t.monto > 0 ? 'abono' : 'cargo',
    icon: t.monto > 0 ? '💰' : '🛍️'
  }))

  const total = homeData.saldo_disponible ?? 0

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
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} MXN
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
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#555' }}>{tx.date}</p>
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

      <div style={{ marginBottom: '100px' }} />
    </div>
  )
}
