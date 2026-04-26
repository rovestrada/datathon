import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Menu, User, ChevronRight } from 'lucide-react'
import { usePet } from '../../context/PetContext'
import { getGifUrl } from './petSprites'
import MobileSidebar from './MobileSidebar'

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

// Card skin themes per pet type+variant
const CARD_THEMES = {
  panda: {
    black: {
      label: 'Panda Negro',
      gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #0a0a0a 100%)',
      accent: '#ffffff',
      textColor: '#fff',
      numberColor: 'rgba(255,255,255,0.55)',
      nameColor: 'rgba(255,255,255,0.3)',
      chipFrom: '#aaaaaa', chipTo: '#dddddd',
      border: '1px solid rgba(255,255,255,0.15)',
    },
    brown: {
      label: 'Panda Café',
      gradient: 'linear-gradient(135deg, #3b2110 0%, #5a3520 50%, #1a0e06 100%)',
      accent: '#e8c090',
      textColor: '#fff',
      numberColor: 'rgba(255,255,255,0.55)',
      nameColor: 'rgba(255,255,255,0.3)',
      chipFrom: '#c8a84b', chipTo: '#e8c96b',
      border: '1px solid rgba(232,192,144,0.25)',
    },
  },
  dog: {
    brown: {
      label: 'Perro Café',
      gradient: 'linear-gradient(135deg, #4a2a10 0%, #7a4a20 45%, #2a1200 100%)',
      accent: '#d4956a',
      textColor: '#fff',
      numberColor: 'rgba(255,255,255,0.55)',
      nameColor: 'rgba(255,255,255,0.3)',
      chipFrom: '#c8a84b', chipTo: '#e8c96b',
      border: '1px solid rgba(212,149,106,0.3)',
      spots: true,
    },
    red: {
      label: 'Perro Rojo',
      gradient: 'linear-gradient(135deg, #5a1a08 0%, #8a2a10 50%, #2a0a02 100%)',
      accent: '#f08060',
      textColor: '#fff',
      numberColor: 'rgba(255,255,255,0.55)',
      nameColor: 'rgba(255,255,255,0.3)',
      chipFrom: '#c8a84b', chipTo: '#e8c96b',
      border: '1px solid rgba(240,128,96,0.3)',
      spots: true,
    },
    white: {
      label: 'Perro Blanco',
      gradient: 'linear-gradient(135deg, #e8e8e8 0%, #f4f4f4 50%, #d0d0d0 100%)',
      accent: '#555',
      textColor: '#111',
      numberColor: 'rgba(0,0,0,0.45)',
      nameColor: 'rgba(0,0,0,0.3)',
      chipFrom: '#c8a84b', chipTo: '#e8c96b',
      border: '1px solid rgba(0,0,0,0.1)',
      spots: true,
    },
    black: {
      label: 'Perro Negro',
      gradient: 'linear-gradient(135deg, #111 0%, #222 50%, #050505 100%)',
      accent: '#aaa',
      textColor: '#fff',
      numberColor: 'rgba(255,255,255,0.45)',
      nameColor: 'rgba(255,255,255,0.25)',
      chipFrom: '#aaaaaa', chipTo: '#cccccc',
      border: '1px solid rgba(255,255,255,0.1)',
      spots: true,
    },
  },
  fox: {
    red: {
      label: 'Zorro Naranja',
      gradient: 'linear-gradient(135deg, #7a2e00 0%, #c05010 45%, #3a1400 100%)',
      accent: '#f97316',
      textColor: '#fff',
      numberColor: 'rgba(255,255,255,0.55)',
      nameColor: 'rgba(255,255,255,0.3)',
      chipFrom: '#c8a84b', chipTo: '#e8c96b',
      border: '1px solid rgba(249,115,22,0.35)',
    },
    white: {
      label: 'Zorro Blanco',
      gradient: 'linear-gradient(135deg, #f0ece8 0%, #faf7f4 50%, #e0d8d0 100%)',
      accent: '#c05010',
      textColor: '#2a1400',
      numberColor: 'rgba(42,20,0,0.45)',
      nameColor: 'rgba(42,20,0,0.3)',
      chipFrom: '#c8a84b', chipTo: '#e8c96b',
      border: '1px solid rgba(192,80,16,0.2)',
    },
  },
}

function CardPreview({ petType, petVariant, cardSkin }) {
  const theme = (CARD_THEMES[petType] ?? CARD_THEMES.panda)[petVariant]
    ?? Object.values(CARD_THEMES[petType] ?? CARD_THEMES.panda)[0]

  return (
    <div style={{
      width: '100%', aspectRatio: '1.586',
      borderRadius: '20px',
      background: theme.gradient,
      padding: '20px',
      position: 'relative',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      border: theme.border,
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Shine */}
      <div style={{
        position: 'absolute', top: '-40%', left: '-15%',
        width: '55%', height: '220%',
        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)',
        transform: 'rotate(-5deg)', pointerEvents: 'none',
      }} />
      {/* Spot decoration for dogs */}
      {theme.spots && (
        <>
          <div style={{ position: 'absolute', top: '18%', right: '22%', width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
          <div style={{ position: 'absolute', top: '55%', right: '38%', width: 14, height: 14, borderRadius: '50%', background: 'rgba(0,0,0,0.09)' }} />
          <div style={{ position: 'absolute', top: '35%', right: '10%', width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.08)' }} />
        </>
      )}
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: theme.accent, letterSpacing: '1px' }}>hey, banco</span>
        <span style={{ fontSize: '10px', color: theme.nameColor, letterSpacing: '1px', textTransform: 'uppercase' }}>Débito</span>
      </div>
      {/* Chip */}
      <div style={{
        width: '36px', height: '26px', borderRadius: '5px',
        background: `linear-gradient(135deg, ${theme.chipFrom}, ${theme.chipTo})`,
        marginTop: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }} />
      {/* Card number */}
      <div style={{ marginTop: '14px', fontSize: '14px', color: theme.numberColor, letterSpacing: '3px', fontFamily: 'monospace' }}>
        •••• •••• •••• 4589
      </div>
      {/* Name */}
      <div style={{ marginTop: '8px', fontSize: '11px', color: theme.nameColor, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
        Titular HeyBanco
      </div>
      {/* Pet GIF */}
      {cardSkin && (
        <img
          src={getGifUrl(petType, petVariant, 'idle')}
          alt=""
          style={{
            position: 'absolute', bottom: '14px', right: '16px',
            width: '72px', height: '72px',
            imageRendering: 'pixelated', opacity: 0.92,
          }}
        />
      )}
    </div>
  )
}

export default function MobileHome({ customerId, onGoToSettings, onGoToHealth, onGoToStatement, onNavigate }) {
  const { petType, petVariant, cardSkin } = usePet()
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      background: '#0a0a12',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentScreen="inicio"
        onNavigate={id => { onNavigate?.(id) }}
      />
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
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <Menu size={22} color="white" />
          </button>
          <button onClick={onGoToSettings} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <User size={22} color="white" />
          </button>
        </div>
      </div>

      {/* Card gallery */}
      <div style={{ padding: '20px 20px 4px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700, color: 'white' }}>Tu tarjeta</h2>
        <CardPreview petType={petType} petVariant={petVariant} cardSkin={cardSkin} />
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          Personaliza el diseño en Ajustes → Mascota
        </p>
      </div>

      {/* Spacer */}
      <div style={{ height: '8px', background: '#0a0a12' }} />

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
