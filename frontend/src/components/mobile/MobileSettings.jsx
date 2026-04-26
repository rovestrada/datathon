import { motion } from 'framer-motion'
import { ChevronRight, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function MobileSettings({ onBack, onNavigate }) {
  const SETTINGS_ITEMS = [
    { id: 'mascota',        icon: '🐾', label: 'Personalizar mascota',     action: () => onNavigate?.('mascota') },
    { id: 'bloqueo',        icon: '🔒', label: 'Bloqueo de emergencia' },
    { id: 'tarjeta-fisica', icon: '💳', label: 'Solicitar tarjeta física' },
    { id: 'activar',        icon: '✅', label: 'Activar tarjeta' },
    { id: 'legal',          icon: '📋', label: 'Legal' },
    { id: 'fallas',         icon: '📱', label: 'Reporte de fallas en tu app' },
    { id: 'sugerencias',    icon: '✉️', label: 'Sugerencias de mejora' },
  ]
  const { logout } = useAuth()

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: '#0a0a12',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#0d1022',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center',
        position: 'relative',
        borderBottom: '1px solid #1a1a2a',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'white', fontSize: '22px', padding: '4px',
            marginRight: '12px',
          }}
          aria-label="Volver"
        >
          ‹
        </button>
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'white' }}>
          Ajustes de la cuenta
        </h1>
      </div>

      {/* Items */}
      <div style={{ flex: 1 }}>
        {SETTINGS_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={item.action}
            style={{
              background: '#1a1a2a',
              borderBottom: '1px solid #0a0a14',
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: '16px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: '15px', color: 'white' }}>{item.label}</span>
            <ChevronRight size={16} color="#555" />
          </motion.div>
        ))}
      </div>

      {/* Logout */}
      <div style={{
        background: '#1a1a2a',
        borderTop: '1px solid #0a0a14',
        padding: '18px 20px',
      }}>
        <button
          onClick={logout}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}
        >
          <LogOut size={20} color="white" />
          <span style={{ flex: 1, fontSize: '15px', color: 'white', textAlign: 'left' }}>Cerrar sesión</span>
          <ChevronRight size={16} color="#555" />
        </button>
      </div>
    </div>
  )
}
