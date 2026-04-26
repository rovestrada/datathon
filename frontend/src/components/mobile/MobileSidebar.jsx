import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse, FileText, LayoutGrid, Bot,
  Settings, PawPrint, X,
} from 'lucide-react'

const PAGES = [
  { id: 'salud',      label: 'Salud Financiera',      icon: HeartPulse,  section: 'Mi dinero'     },
  { id: 'estado',     label: 'Estado de Cuenta',      icon: FileText,    section: 'Mi dinero'     },
  { id: 'cards',      label: 'Mis Tarjetas',          icon: LayoutGrid,  section: 'Mi dinero'     },
  { id: 'havi',       label: 'Asistente HAVI',        icon: Bot,         section: 'Herramientas'  },
  { id: 'ajustes',    label: 'Ajustes',               icon: Settings,    section: 'Herramientas'  },
  { id: 'mascota',    label: 'Mi Mascota',            icon: PawPrint,    section: 'Herramientas'  },
]

const SECTIONS = ['Mi dinero', 'Herramientas']

export default function MobileSidebar({ open, onClose, currentScreen, onNavigate }) {
  const handleNav = (id) => {
    onNavigate(id)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 100,
            }}
          />

          {/* Drawer */}
          <motion.div
            key="sidebar-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '72vw', maxWidth: '300px',
              background: '#0d1022',
              borderLeft: '1px solid #1a1a35',
              zIndex: 101,
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
              boxShadow: '-4px 0 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 18px 16px',
              borderBottom: '1px solid #1a1a35',
            }}>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px', display: 'flex', alignItems: 'center',
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
              <img src="/HeyBancoLogo.svg" alt="Hey" height={22} style={{ opacity: 0.9 }} />
            </div>

            {/* Nav sections */}
            <div style={{ flex: 1, padding: '10px 0 24px' }}>
              {SECTIONS.map(section => {
                const items = PAGES.filter(p => p.section === section)
                return (
                  <div key={section}>
                    <p style={{
                      margin: '16px 18px 6px',
                      fontSize: '10px', fontWeight: 700,
                      color: '#4b5563', textTransform: 'uppercase', letterSpacing: '1.2px',
                    }}>
                      {section}
                    </p>
                    {items.map(page => {
                      const Icon = page.icon
                      const active = currentScreen === page.id
                      return (
                        <motion.button
                          key={page.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleNav(page.id)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                            padding: '12px 18px',
                            background: active ? 'rgba(124,58,237,0.15)' : 'none',
                            border: 'none',
                            borderLeft: active ? '3px solid #a78bfa' : '3px solid transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <Icon
                            size={20}
                            color={active ? '#a78bfa' : '#6b7280'}
                            strokeWidth={active ? 2.2 : 1.8}
                          />
                          <span style={{
                            fontSize: '14px',
                            fontWeight: active ? 700 : 500,
                            color: active ? '#e9d5ff' : '#9ca3af',
                          }}>
                            {page.label}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
