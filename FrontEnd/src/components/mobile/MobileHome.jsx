import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, SlidersHorizontal, User, ChevronRight } from 'lucide-react'

const BALANCE = 96.84

const MY_PRODUCTS = [
  {
    id: 'cuentas',
    icon: '💳',
    iconBg: '#6c3fc9',
    title: 'Cuentas',
    value: `$${BALANCE.toFixed(2)}`,
    sub: 'Suma total de las cuentas',
  },
  {
    id: 'referidos',
    icon: '👥',
    iconBg: '#d97706',
    title: 'Refiere a tus amigos',
    value: '1',
    sub: 'Mis referidos',
  },
  {
    id: 'ahorro',
    icon: '🛍️',
    iconBg: '#0891b2',
    title: 'Ahorro inmediato',
    value: '$24.10',
    sub: 'Total ahorro inmediato',
    badge: 'Estatus: Activo',
    badgeColor: '#22d3ee',
  },
]

const AVAILABLE_PRODUCTS = [
  {
    id: 'tc',
    icon: '💳',
    iconBg: '#111',
    title: 'Tarjeta de Crédito',
    desc: '¡Obtén MSI, recompensas y más!',
  },
  {
    id: 'tcg',
    icon: '🟡',
    iconBg: '#111',
    title: 'Tarjeta de Crédito con Garantía*',
    desc: 'La mejor opción para aprender a usar una tarjeta de crédito.',
  },
  {
    id: 'cp',
    icon: '💰',
    iconBg: '#111',
    title: 'Crédito personal',
    desc: 'Solicita desde $1,000 hasta $400,000',
  },
  {
    id: 'ca',
    icon: '🚗',
    iconBg: '#111',
    title: 'Crédito de auto',
    desc: '¡Encuentra tu auto al precio que quieres!',
  },
]

export default function MobileHome({ customerId, onGoToSettings, onGoToHealth, onGoToStatement }) {
  const [balanceHidden, setBalanceHidden] = useState(false)

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      background: '#0a0a12',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: '#0d1022',
        padding: '14px 20px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ fontWeight: 900, fontStyle: 'italic', fontSize: '22px', color: 'white' }}>hey,</span>
          <span style={{ fontWeight: 600, fontSize: '20px', color: 'white', marginLeft: '6px' }}>
            {customerId ? customerId.toString().charAt(0).toUpperCase() + customerId.toString().slice(1) : 'Usuario'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={onGoToHealth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <SlidersHorizontal size={22} color="white" />
          </button>
          <button onClick={onGoToSettings} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <User size={22} color="white" />
          </button>
        </div>
      </div>

      {/* My products header */}
      <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>Mis productos contratados</h2>
        <button
          onClick={() => setBalanceHidden(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4db6e8', fontSize: '13px', fontWeight: 500 }}
        >
          {balanceHidden ? 'Mostrar saldos' : 'Ocultar saldos'}
        </button>
      </div>

      {/* Product rows */}
      {MY_PRODUCTS.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          onClick={p.id === 'cuentas' ? onGoToStatement : undefined}
          style={{
            background: '#1a1a2a',
            borderBottom: '1px solid #0a0a14',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: p.iconBg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', flexShrink: 0,
          }}>
            {p.icon}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'white' }}>{p.title}</p>
            {p.badge && (
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: p.badgeColor, fontWeight: 500 }}>{p.badge}</p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'white' }}>
              {balanceHidden ? '•••••' : p.value}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>{p.sub}</p>
          </div>
        </motion.div>
      ))}

      {/* Spacer */}
      <div style={{ height: '8px', background: '#0a0a12' }} />

      {/* Available products */}
      <div style={{ padding: '20px 20px 12px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>Productos disponibles para ti</h2>
      </div>

      {AVAILABLE_PRODUCTS.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 + i * 0.07 }}
          style={{
            background: '#1a1a2a',
            borderBottom: '1px solid #0a0a14',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: '#111', border: '1px solid #222',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0,
          }}>
            {p.icon}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'white' }}>{p.title}</p>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>{p.desc}</p>
          </div>
          <ChevronRight size={16} color="#555" />
        </motion.div>
      ))}

      {/* Bottom padding for nav */}
      <div style={{ height: '80px' }} />
    </div>
  )
}
