# FRONTEND SNAPSHOT

## 1. Estructura de Carpetas y Archivos
```
FrontEnd/
├── package.json
├── index.html
├── vite.config.js
├── public/
│   ├── favicon.svg
│   ├── HeyBancoLogo.svg
│   ├── icons.svg
│   └── pets/
│       ├── dog/
│       │   ├── black_idle.gif
│       │   ├── black_run.gif
│       │   ├── black_walk.gif
│       │   ├── brown_idle.gif
│       │   ├── brown_run.gif
│       │   ├── brown_walk.gif
│       │   ├── icon.png
│       │   ├── red_idle.gif
│       │   ├── red_run.gif
│       │   ├── red_walk.gif
│       │   ├── white_idle.gif
│       │   ├── white_run.gif
│       │   └── white_walk.gif
│       ├── fox/
│       │   ├── icon.png
│       │   ├── red_idle.gif
│       │   ├── red_run.gif
│       │   ├── red_walk.gif
│       │   ├── white_idle.gif
│       │   ├── white_run.gif
│       │   └── white_walk.gif
│       └── panda/
│           ├── black_idle.gif
│           ├── black_run.gif
│           ├── black_walk.gif
│           ├── brown_idle.gif
│           ├── brown_run.gif
│           ├── brown_walk.gif
│           └── icon.png
└── src/
    ├── App.css
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components/
    │   ├── Card.jsx
    │   ├── ChatbotHAVI.jsx
    │   ├── Dashboard.jsx
    │   ├── FloatingPet.jsx
    │   ├── HaviLogo.jsx
    │   ├── HeyBancoLogoRaw.jsx
    │   ├── Login.jsx
    │   └── mobile/
    │       ├── HaviBubble.jsx
    │       ├── MobileApp.jsx
    │       ├── MobileFinancialHealth.jsx
    │       ├── MobileHAVI.jsx
    │       ├── MobileHome.jsx
    │       ├── MobileLogin.jsx
    │       ├── MobilePetCustomization.jsx
    │       ├── MobileScreens.jsx
    │       ├── MobileSettings.jsx
    │       ├── MobileStatement.jsx
    │       ├── NavPet.jsx
    │       └── petSprites.jsx
    └── context/
        ├── AuthContext.jsx
        └── PetContext.jsx
```

## 2. Contenido de Archivos

### src/main.jsx
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PetProvider } from './context/PetContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PetProvider>
      <App />
    </PetProvider>
  </StrictMode>,
)
```

### src/App.jsx
```jsx
import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import FloatingPet from './components/FloatingPet'
import ChatbotHAVI, { ChatToggleButton } from './components/ChatbotHAVI'
import MobileApp from './components/mobile/MobileApp'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function AppContent() {
  const { isAuthenticated, customerId } = useAuth()
  const [chatOpen, setChatOpen] = useState(false)
  const isMobile = useIsMobile()

  const openChat = useCallback(() => setChatOpen(true), [])
  const toggleChat = useCallback(() => setChatOpen(o => !o), [])

  // Mobile: always use MobileApp (it handles its own auth gate)
  if (isMobile) {
    return <MobileApp />
  }

  return (
    <AnimatePresence mode="wait">
      {isAuthenticated ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ minHeight: '100vh', width: '100%', display: 'block', position: 'relative' }}
        >
          <Dashboard />
          <FloatingPet onOpenChat={openChat} />
          <ChatbotHAVI isOpen={chatOpen} onClose={() => setChatOpen(false)} customerId={customerId} />
          <ChatToggleButton isOpen={chatOpen} onClick={toggleChat} unread={1} />
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Login />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
```

### src/components/Dashboard.jsx
```jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronRight, ChevronLeft, Eye, EyeOff, Bell, User,
  Download, Printer, Info, Pin, ArrowRightLeft,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Constants ────────────────────────────────────────────────────────────────
const BALANCE     = 96.84
const LAST_ACCESS = '25/04/2026 14:24'

const NAV_ITEMS = [
  { label: 'Resumen',         active: true  },
  { label: 'Consultas',       sub: true     },
  { label: 'Transferencias'                 },
  { label: 'Pagos'                          },
  { label: 'Perfil',          sub: true     },
  { label: 'Ahorro'                         },
  { label: 'Inversiones'                    },
  { label: 'Administración',  sub: true     },
  { label: 'Centro de ayuda', sub: true     },
]

// ─── Semi-circle gauge ────────────────────────────────────────────────────────
function SemiGauge({ pct = 0, color = '#22d3ee', size = 170 }) {
  const r      = size * 0.38
  const cx     = size / 2
  const cy     = size * 0.54
  const arcLen = Math.PI * r
  const filled = (Math.min(pct, 100) / 100) * arcLen
  const d      = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <svg width={size} height={size * 0.58} viewBox={`0 0 ${size} ${size * 0.58}`}>
      <path d={d} fill="none" stroke="#e5e7eb" strokeWidth="13" strokeLinecap="round" />
      {pct > 0 && (
        <motion.path
          d={d} fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${arcLen}` }}
          animate={{ strokeDasharray: `${filled} ${arcLen}` }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.35 }}
        />
      )}
    </svg>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function SidebarContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '26px 22px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
          <span style={{ color: 'white', fontWeight: 900, fontStyle: 'italic', fontSize: '21px', letterSpacing: '-0.5px' }}>hey</span>
          <span style={{ color: '#a78bfa', fontWeight: 900, fontStyle: 'italic', fontSize: '21px' }}>,</span>
          <span style={{ color: '#d1d5db', fontWeight: 300, fontSize: '19px', marginLeft: '3px' }}>banco</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingBottom: '24px' }}>
        {NAV_ITEMS.map(item => (
          <div
            key={item.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 22px',
              color: item.active ? '#a78bfa' : '#9ca3af',
              cursor: 'pointer', fontSize: '13.5px',
              background: item.active ? 'rgba(167,139,250,0.1)' : 'transparent',
              borderLeft: item.active ? '3px solid #a78bfa' : '3px solid transparent',
              fontWeight: item.active ? 500 : 400,
            }}
          >
            <span>{item.label}</span>
            {item.sub && <ChevronRight size={13} style={{ opacity: 0.55 }} />}
          </div>
        ))}
      </nav>
    </div>
  )
}

// ─── Top bar ─────────────────────────────────────────────────────────────────
function TopBar({ onLogout, customerId }) {
  return (
    <header style={{
      background: 'white',
      padding: '10px 24px',
      display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
    }}>
      <div style={{ textAlign: 'right', marginRight: '4px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#111', margin: 0, letterSpacing: '0.2px' }}>
          Usuario #{customerId}
        </p>
      </div>

      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} aria-label="Perfil">
        <User size={18} style={{ color: '#9ca3af' }} />
      </button>

      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', position: 'relative' }} aria-label="Notificaciones">
        <Bell size={18} style={{ color: '#9ca3af' }} />
        <span style={{
          position: 'absolute', top: '3px', right: '3px',
          width: '7px', height: '7px', borderRadius: '50%', background: '#a78bfa',
          border: '1.5px solid white',
        }} />
      </button>

      <button
        onClick={onLogout}
        style={{
          background: 'white', border: '1px solid #d1d5db', borderRadius: '6px',
          padding: '6px 14px', fontSize: '12.5px', fontWeight: 500, color: '#374151',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        Cerrar sesión
      </button>
    </header>
  )
}

// ─── Account card ─────────────────────────────────────────────────────────────
function AccountCard({ balanceHidden, onToggleBalance }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      style={{
        background: 'white', borderRadius: '14px', padding: '20px 22px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flex: '1', minWidth: '260px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#111', letterSpacing: '0.6px', margin: 0 }}>
            CUENTA HEY – *001-5
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '3px 0 0' }}>Cuenta Hey</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onToggleBalance} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} aria-label="Mostrar/ocultar saldo">
            {balanceHidden ? <EyeOff size={15} color="#9ca3af" /> : <Eye size={15} color="#9ca3af" />}
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <ArrowRightLeft size={14} color="#9ca3af" />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
        <SemiGauge pct={0} color="#22d3ee" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '4px', marginBottom: '16px' }}>
        {[
          { label: 'Abonos',     value: '$0.00 MXN'                              },
          { label: 'Disponible', value: balanceHidden ? '•••••' : '$96.84 MXN'  },
          { label: 'Gastos',     value: '$0.00 MXN'                              },
        ].map(s => (
          <div key={s.label}>
            <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>{s.label}</p>
            <p style={{ fontSize: '11.5px', fontWeight: 600, color: '#111', margin: '3px 0 0' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <button style={{
        width: '100%', padding: '10px', background: '#111', color: 'white',
        border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
      }}>
        Transferir
      </button>
    </motion.div>
  )
}

// ─── Savings card ─────────────────────────────────────────────────────────────
function SavingsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      style={{
        background: 'white', borderRadius: '14px', padding: '20px 22px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flex: '1', minWidth: '260px',
      }}
    >
      <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Ahorro Inmediato</p>
      <p style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: '4px 0 0' }}>Mi Ahorro</p>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
        <SemiGauge pct={32} color="#22d3ee" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '4px', marginBottom: '14px' }}>
        {[
          { label: 'Mi dinero ahorrado',   value: '$24.10 MXN' },
          { label: 'Ahorro por cada compra', value: '5%'        },
          { label: 'Rendimiento generado', value: '$0.08 MXN'  },
        ].map(s => (
          <div key={s.label}>
            <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0, lineHeight: '1.35' }}>{s.label}</p>
            <p style={{ fontSize: '11.5px', fontWeight: 600, color: '#111', margin: '3px 0 0' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
        Para realizar cambios en tu ahorro inmediato o consultar más detalles, inicia sesión desde tu App Hey.
      </p>
    </motion.div>
  )
}

// ─── Dashboard root ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { logout, customerId } = useAuth()
  const [balanceHidden, setBalanceHidden] = useState(false)

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '210px', minWidth: '210px', background: '#111',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f2f4', minWidth: 0 }}>
        <TopBar onLogout={logout} customerId={customerId} />

        <main style={{ flex: 1, padding: '20px 28px 100px', overflowY: 'auto' }}>
          {/* Page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Pin size={15} style={{ color: '#6b7280' }} />
            <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#111', margin: 0 }}>Resumen</h1>
          </div>

          {/* Balance row */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', flexWrap: 'wrap',
            gap: '12px', marginBottom: '22px',
          }}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px' }}>Mi dinero disponible</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#0ea5e9', margin: 0 }}>
                {balanceHidden ? '•••••••' : `$${BALANCE.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`}
              </p>
            </motion.div>

            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 6px', textAlign: 'right' }}>Mis inversiones</p>
              <button style={{
                background: 'white', border: '1px solid #d1d5db', borderRadius: '8px',
                padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#111',
              }}>
                Nuevo pagaré
              </button>
            </div>
          </div>

          {/* Products */}
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#111', margin: '0 0 14px' }}>Mis productos</p>

          <div style={{ position: 'relative', paddingLeft: '8px', paddingRight: '8px' }}>
            {/* Nav arrows */}
            {[
              { side: 'left',  icon: <ChevronLeft  size={14} color="#6b7280" />, pos: { left:  '-6px' } },
              { side: 'right', icon: <ChevronRight size={14} color="#6b7280" />, pos: { right: '-6px' } },
            ].map(arrow => (
              <button key={arrow.side} style={{
                position: 'absolute', ...arrow.pos, top: '50%', transform: 'translateY(-50%)',
                width: '28px', height: '28px', borderRadius: '50%', background: 'white',
                border: '1px solid #e5e7eb', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 2,
              }}>
                {arrow.icon}
              </button>
            ))}

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <AccountCard balanceHidden={balanceHidden} onToggleBalance={() => setBalanceHidden(h => !h)} />
              <SavingsCard />
            </div>
          </div>

          {/* Account statement */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            style={{
              background: 'white', borderRadius: '14px', padding: '18px 22px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginTop: '20px',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <select style={{
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
                fontSize: '12px', fontWeight: 600, color: '#374151', background: 'white',
                cursor: 'pointer', appearance: 'auto',
              }}>
                <option>CUENTA HEY MXN</option>
              </select>

              <button style={{
                padding: '8px 16px', background: '#111', color: 'white', border: 'none',
                borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                Estados de Cuenta
              </button>

              {[
                { icon: <Download size={13} />, label: 'Descargar como' },
                { icon: <Printer  size={13} />, label: 'Imprimir'       },
              ].map(btn => (
                <button key={btn.label} style={{
                  padding: '8px 14px', background: 'white', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {btn.icon}{btn.label}
                </button>
              ))}
            </div>

            <div style={{
              marginTop: '16px', padding: '12px 16px', background: '#eff6ff',
              borderRadius: '8px', border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <Info size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#374151' }}>Sin resultados</span>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
```

### src/components/ChatbotHAVI.jsx
```jsx
import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, Landmark } from 'lucide-react'
import HaviLogo from './HaviLogo'

// ─── Data ─────────────────────────────────────────────────────────────────────

const BOT_RESPONSES = [
  'Entendido. ¿En qué más puedo ayudarte?',
  'Excelente pregunta. Puedo ayudarte con transferencias, saldos y más.',
  'Tu saldo disponible es $96.84 MXN. ¿Deseas más información?',
  'Recomiendo revisar tus movimientos recientes para identificar gastos.',
  'Para transferir dinero ve a la sección Transferencias del menú.',
  'Tu ahorro inmediato está generando un rendimiento del 5%. ¡Bien hecho!',
  'Puedo ayudarte a programar pagos automáticos. ¿Te interesa?',
  'Recuerda que tu Cuenta Hey no tiene comisiones por mantenimiento.',
  'Tu ahorro acumulado es $24.10 MXN. ¡Sigue adelante!',
]

const WELCOME_MESSAGE = (customerId) => ({
  id: 'welcome',
  from: 'bot',
  text: `¡Hola, Usuario #${customerId}! Soy HAVI, tu asistente financiero inteligente de hey, banco. ¿En qué puedo ayudarte hoy?`,
  ts: Date.now(),
})

let msgCounter = 1

// ─── Bot typing indicator ─────────────────────────────────────────────────────

function BotTyping() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: '#a78bfa', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Landmark size={14} color="white" />
      </div>
      <div style={{
        padding: '10px 14px', background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '16px', borderBottomLeftRadius: '4px',
        display: 'flex', gap: '5px', alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a78bfa', display: 'block' }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isBot = msg.from === 'bot'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex', alignItems: 'flex-end', gap: '10px',
        flexDirection: isBot ? 'row' : 'row-reverse',
      }}
    >
      {isBot && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: '#a78bfa', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Landmark size={14} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: '68%',
        padding: '10px 14px',
        fontSize: '14px',
        lineHeight: '1.55',
        borderRadius: '16px',
        borderBottomLeftRadius: isBot ? '4px' : '16px',
        borderBottomRightRadius: isBot ? '16px' : '4px',
        background: isBot ? 'white' : '#a78bfa',
        color: isBot ? '#111' : 'white',
        border: isBot ? '1px solid #e5e7eb' : 'none',
        fontWeight: isBot ? 400 : 500,
        boxShadow: isBot ? '0 1px 3px rgba(0,0,0,0.04)' : '0 2px 8px rgba(167,139,250,0.3)',
      }}>
        {msg.text}
      </div>
    </motion.div>
  )
}

// ─── Chatbot panel ────────────────────────────────────────────────────────────

const ChatbotHAVI = memo(function ChatbotHAVI({ isOpen, onClose, customerId }) {
  const [messages, setMessages] = useState(() => [WELCOME_MESSAGE(customerId)])
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef          = useRef(null)
  const inputRef                = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text) return

    const userMsg = { id: msgCounter++, from: 'user', text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const delay = 350 + Math.random() * 500
    setTimeout(() => {
      const botText = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)]
      setIsTyping(false)
      setMessages(prev => [...prev, { id: msgCounter++, from: 'bot', text: botText, ts: Date.now() }])
    }, delay)
  }, [input])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="chat-window"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed z-50 flex flex-col"
          style={{
            bottom: '88px',
            right: '16px',
            width: 'min(360px, calc(100vw - 32px))',
            height: 'min(520px, calc(100vh - 120px))',
            background: '#0d0d0d',
            border: '1px solid #222',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.08)',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-label="Chat con HAVI"
          aria-modal="true"
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ background: '#111', borderBottom: '1px solid #1a1a1a' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#3c4150', border: '1px solid #a78bfa22' }}>
                <HaviLogo size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">HAVI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22d3ee' }} />
                  <span className="text-xs" style={{ color: '#555' }}>Asistente financiero</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors duration-150 hover:bg-white/5"
                aria-label="Cerrar chat"
              >
                <X size={16} style={{ color: '#666' }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {isTyping && <BotTyping />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 flex-shrink-0"
              style={{ background: '#111', borderTop: '1px solid #1a1a1a' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: '#1a1a2a', border: '1px solid #2a2a2a' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu consulta…"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                  aria-label="Mensaje para HAVI"
                  maxLength={500}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-40"
                  style={{ background: input.trim() ? '#a78bfa' : '#222' }}
                  aria-label="Enviar mensaje"
                >
                  {isTyping
                    ? <Loader2 size={14} color="#888" className="animate-spin" />
                    : <Send size={14} color={input.trim() ? '#fff' : '#555'} />
                  }
                </motion.button>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

// ─── Floating toggle button ───────────────────────────────────────────────────

export function ChatToggleButton({ isOpen, onClick, unread }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="fixed z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
      style={{
        bottom: '24px', right: '24px',
        background: isOpen ? '#1a1a1a' : '#a78bfa',
        border: isOpen ? '1px solid #2a2a2a' : 'none',
        boxShadow: isOpen ? 'none' : '0 8px 24px rgba(167,139,250,0.4)',
      }}
      aria-label={isOpen ? 'Cerrar HAVI' : 'Abrir asistente HAVI'}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
            <X size={22} color="#aaa" />
          </motion.span>
        ) : (
          <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
            <Landmark size={22} color="#fff" />
          </motion.span>
        )}
      </AnimatePresence>
      {!isOpen && unread > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-black"
          style={{ background: '#22d3ee' }}
        >
          {unread}
        </motion.span>
      )}
    </motion.button>
  )
}

export default ChatbotHAVI
```

### src/components/Login.jsx
```jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    setTimeout(() => {
      login(value.trim())
      setLoading(false)
    }, 500)
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#f0f2f4',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '400px', padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 700, fontStyle: 'italic', color: '#111', letterSpacing: '-1px' }}>
            hey
          </span>
          <span style={{ fontSize: '36px', fontWeight: 700, color: '#111' }}>,</span>
          <span style={{ fontSize: '32px', fontWeight: 400, color: '#111', marginLeft: '6px', letterSpacing: '-0.5px' }}>
            banco
          </span>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '28px 28px 32px',
        }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111' }}>Iniciar sesión</h2>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#111', display: 'block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d1d5db', display: 'block' }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Escribe tu usuario
            </label>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                type={show ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="username"
                value={value}
                onChange={e => setValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#eef0f4',
                  fontSize: '15px',
                  color: '#111',
                  outline: 'none',
                  boxSizing: 'border-box',
                  letterSpacing: '3px',
                }}
                aria-label="Usuario"
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  color: '#9ca3af',
                }}
                aria-label={show ? 'Ocultar' : 'Mostrar'}
              >
                {show ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !value.trim()}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '8px', border: 'none',
                background: loading || !value.trim() ? '#555' : '#111',
                color: 'white', fontSize: '15px', fontWeight: 600,
                cursor: loading || !value.trim() ? 'default' : 'pointer',
                transition: 'background 0.2s',
                float: 'right',
              }}
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </motion.button>
          </form>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 10px' }}>
            Si lo necesitas, llámanos. Con gusto te atenderemos.
          </p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
            (81) 4392–2626
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            (81 HEYBANCO)
          </p>
        </div>
      </motion.div>

      {/* Bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '10px 20px', display: 'flex', justifyContent: 'space-between',
        fontSize: '11px', color: '#aaa',
      }}>
        <span>2.4.5-2-1776988463989</span>
        <span>La IP desde la que te estás conectando es: 131.178.102.152</span>
      </div>
    </div>
  )
}
```

### src/components/mobile/MobileApp.jsx
```jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, CreditCard, ArrowLeftRight, Inbox } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePet } from '../../context/PetContext'

import MobileLogin from './MobileLogin'
import MobileHome from './MobileHome'
import MobileHAVI from './MobileHAVI'
import MobileSettings from './MobileSettings'
import { MobilePagos, MobileTransferir, MobileBuzon } from './MobileScreens'
import MobileFinancialHealth from './MobileFinancialHealth'
import MobileStatement from './MobileStatement'
import MobilePetCustomization from './MobilePetCustomization'
import HaviBubble from './HaviBubble'
import NavPet from './NavPet'
import HaviLogo from '../HaviLogo'

// Screens that hide bottom nav AND the pet
const FULL_SCREENS = ['havi', 'ajustes', 'mascota']
// Screens that show the bottom nav bar
const NAV_SCREENS  = ['inicio', 'pagos', 'transferir', 'buzon']
// Screens with no nav, no full-screen modal (pet walks at actual bottom)
const FREE_SCREENS = ['salud', 'estado']

const NAV_TABS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'pagos',  label: 'Pagos',  icon: CreditCard },
  { id: 'transferir', label: 'Transferir', icon: ArrowLeftRight },
  { id: 'buzon',  label: 'Buzón',  icon: Inbox, badge: 3 },
]

export default function MobileApp() {
  const { isAuthenticated, customerId } = useAuth()
  const { petEnabled, petType, petVariant } = usePet()
  const [screen, setScreen] = useState('inicio')
  const [prevScreen, setPrevScreen] = useState(null)
  const [petPaused, setPetPaused] = useState(false)

  // Pause pet whenever entering a free screen; bubble dismiss will unpause
  useEffect(() => {
    if (FREE_SCREENS.includes(screen)) setPetPaused(true)
  }, [screen])

  const goTo = (s) => { setPrevScreen(screen); setScreen(s) }
  const goBack = () => { setScreen(prevScreen || 'inicio'); setPrevScreen(null) }

  // Visibility logic
  const isNavScreen   = NAV_SCREENS.includes(screen)    // has bottom nav bar
  const isFullScreen  = FULL_SCREENS.includes(screen)   // no pet, no nav
  const isFreeScreen  = FREE_SCREENS.includes(screen)   // salud / estado
  const showBottomNav = isNavScreen
  // Pet visible on home (above nav) and on secondary screens (at actual bottom)
  const showPet        = petEnabled && (screen === 'inicio' || isFreeScreen)
  const petNavVisible  = screen === 'inicio'             // tells NavPet to sit above nav
  const showHAVICorner = !petEnabled && isFreeScreen
  const showBubble     = !isFullScreen
  const thoughtBubble  = isFreeScreen

  if (!isAuthenticated) {
    return <MobileLogin />
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#0a0a12',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
    }}>
      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {screen === 'inicio'     && <MobileHome customerId={customerId} onGoToSettings={() => goTo('ajustes')} onGoToHealth={() => goTo('salud')} onGoToStatement={() => goTo('estado')} />}
          {screen === 'pagos'      && <MobilePagos onBack={goBack} />}
          {screen === 'transferir' && <MobileTransferir customerId={customerId} onBack={goBack} />}
          {screen === 'buzon'      && <MobileBuzon onBack={goBack} />}
          {screen === 'havi'       && <MobileHAVI customerId={customerId} onBack={goBack} />}
          {screen === 'ajustes'    && <MobileSettings onBack={goBack} onNavigate={goTo} />}
          {screen === 'salud'      && <MobileFinancialHealth onBack={goBack} onOpenHAVI={() => goTo('havi')} />}
          {screen === 'estado'     && <MobileStatement onBack={goBack} onOpenHAVI={() => goTo('havi')} />}
          {screen === 'mascota'    && <MobilePetCustomization onBack={goBack} />}
        </motion.div>
      </AnimatePresence>

      {/* HAVI suggestion bubble */}
      {showBubble && (
        <HaviBubble
          screen={screen}
          onOpenHAVI={() => goTo('havi')}
          bottomOffset={isNavScreen ? '88px' : '82px'}
          thoughtBubble={thoughtBubble && petEnabled}
          onDismiss={isFreeScreen ? () => setPetPaused(false) : undefined}
        />
      )}

      {/* Pet — above nav on home; at actual screen bottom on secondary screens */}
      {showPet && (
        <NavPet
          petType={petType}
          petVariant={petVariant}
          navVisible={petNavVisible}
          paused={isFreeScreen && petPaused}
          onPress={() => goTo('havi')}
        />
      )}

      {/* HAVI corner logo when pet is disabled on non-home sections */}
      {showHAVICorner && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => goTo('havi')}
          style={{
            position: 'fixed', bottom: '20px', right: '16px',
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#1e1040',
            border: '2px solid #a78bfa66',
            cursor: 'pointer', zIndex: 45,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(167,139,250,0.25)',
          }}
          aria-label="Abrir HAVI"
        >
          <HaviLogo size={32} />
        </motion.button>
      )}

      {/* Bottom nav — on all 4 main tabs */}
      {showBottomNav && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: '#0d1022',
          borderTop: '1px solid #1a1a2a',
          display: 'flex', alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}>
          {/* Left 2 tabs */}
          {NAV_TABS.slice(0, 2).map(tab => (
            <NavTab key={tab.id} tab={tab} active={screen === tab.id} onPress={() => goTo(tab.id)} />
          ))}

          {/* Center HAVI button */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '6px 0 8px', position: 'relative' }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => goTo('havi')}
              style={{
                width: '58px', height: '58px', borderRadius: '50%',
                background: 'transparent',
                border: '3px solid transparent',
                backgroundImage: 'linear-gradient(#0d1022, #0d1022), linear-gradient(135deg, #7c3aed, #22d3ee, #a78bfa, #7c3aed)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative', top: '-10px',
              }}
              aria-label="HAVI"
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', letterSpacing: '0.5px' }}>HAVI</span>
            </motion.button>
          </div>

          {/* Right 2 tabs */}
          {NAV_TABS.slice(2).map(tab => (
            <NavTab key={tab.id} tab={tab} active={screen === tab.id} onPress={() => goTo(tab.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function NavTab({ tab, active, onPress }) {
  const Icon = tab.icon
  return (
    <button
      onClick={onPress}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '3px', padding: '8px 0 8px',
        background: 'none', border: 'none', cursor: 'pointer',
        position: 'relative',
      }}
      aria-label={tab.label}
    >
      <div style={{ position: 'relative' }}>
        <Icon size={22} color={active ? '#a78bfa' : '#6b7280'} />
        {tab.badge && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-7px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#a78bfa', color: 'white',
            fontSize: '10px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {tab.badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: '10px', color: active ? '#a78bfa' : '#6b7280', fontWeight: active ? 600 : 400 }}>
        {tab.label}
      </span>
    </button>
  )
}
```

### src/context/AuthContext.jsx
```jsx
import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'havi_customer_id'

export function AuthProvider({ children }) {
  const [customerId, setCustomerId] = useState(() => localStorage.getItem(SESSION_KEY))

  const login = useCallback((id) => {
    localStorage.setItem(SESSION_KEY, id)
    setCustomerId(id)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setCustomerId(null)
  }, [])

  const isAuthenticated = Boolean(customerId)

  return (
    <AuthContext.Provider value={{ customerId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

### src/index.css
```css
@import "tailwindcss";

@layer base {
  * {
    box-sizing: border-box;
  }

  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
    background: #f0f2f4;
    color: #111;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  ::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 2px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #00ff88;
  }
}
```

## 3. Dependencias de package.json
```json
"dependencies": {
  "@tailwindcss/vite": "^4.2.4",
  "clsx": "^2.1.1",
  "framer-motion": "^12.38.0",
  "lucide-react": "^1.11.0",
  "react": "^19.2.5",
  "react-dom": "^19.2.5",
  "tailwindcss": "^4.2.4"
}
```

## 4. Resumen de Componentes

| Componente | Función |
| :--- | :--- |
| **App** | Punto de entrada. Determina si el usuario es móvil o desktop y si está autenticado. |
| **Login** | Pantalla de inicio de sesión para escritorio con estética de Hey Banco. |
| **Dashboard** | Interfaz principal de escritorio. Muestra saldos, resúmenes y navegación lateral. |
| **ChatbotHAVI** | Ventana flotante de chat con HAVI. Maneja estados de escritura y respuestas simuladas. |
| **FloatingPet** | Mascota virtual en pixel art que camina por la pantalla (Desktop). |
| **MobileApp** | Contenedor principal para la versión móvil. Maneja el sistema de navegación por estados. |
| **MobileHome** | Pantalla de inicio móvil con previsualización de tarjeta dinámica y lista de productos. |
| **MobileHAVI** | Interfaz de chat optimizada para móvil, con saludos personalizados por ID de cliente. |
| **MobileFinancialHealth** | Pantalla de salud financiera con gráficos de "gauge" y consejos de ahorro. |
| **MobileStatement** | Historial de transacciones y consulta de estados de cuenta mensuales. |
| **MobilePetCustomization** | Ajustes para habilitar/deshabilitar la mascota y cambiar su tipo (Panda, Perro, Zorro). |
| **NavPet** | Mascota animada para móvil que interactúa con la barra de navegación inferior. |
| **HaviBubble** | Burbuja de sugerencias contextuales que aparece según la pantalla actual. |

## 5. Rutas de React Router
Actualmente el proyecto **no utiliza React Router**. La navegación se maneja mediante:
1.  **Auth Gate:** Condicional `isAuthenticated` en `App.jsx`.
2.  **Versión:** Hook `useIsMobile` para alternar entre Desktop y Mobile.
3.  **Estado Interno:** Un estado `screen` en `MobileApp.jsx` que renderiza componentes condicionalmente con animaciones de `AnimatePresence`.

## 6. Llamadas a la API Implementadas
Actualmente **no existen llamadas reales a una API externa** vía `fetch` o `axios`.
- **Autenticación:** Se simula guardando el ID del cliente en `localStorage`.
- **Datos:** Todos los saldos, transacciones y respuestas del bot están hardcodeados como constantes en los componentes.
- **Servicios:** La lógica de "back-end" está simulada con `setTimeout` para dar sensación de asincronía.
