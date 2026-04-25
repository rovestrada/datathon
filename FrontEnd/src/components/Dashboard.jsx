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


