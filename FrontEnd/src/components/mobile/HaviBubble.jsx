import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

// Per-screen HAVI suggestions
const SUGGESTIONS = {
  pagos: '¿Sabías que puedes programar pagos automáticos? ¡Actívalo y olvídate de fechas!',
  transferir: 'Puedo ayudarte a hacer una transferencia SPEI sin comisiones. ¿A quién le vas a enviar?',
  buzon: 'Tienes notificaciones pendientes. ¿Quieres que te resuma las más importantes?',
  ajustes: '¿Necesitas bloquear tu tarjeta de emergencia? Puedo guiarte en segundos.',
  salud: 'Tu salud financiera es buena. Te recomiendo activar el plan de ahorro Plus para mejorar tu rendimiento.',
  estado: 'Detecté que no tienes gastos registrados este mes. ¡Ideal para mover saldo a ahorro y ganar más rendimiento!',
}

export default function HaviBubble({ screen, onOpenHAVI, bottomOffset = '88px' }) {
  const [visible, setVisible] = useState(false)
  const suggestion = SUGGESTIONS[screen]

  useEffect(() => {
    if (!suggestion) return
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [screen])

  if (!suggestion) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{
            position: 'fixed',
            bottom: bottomOffset,
            left: '16px',
            right: '16px',
            zIndex: 40,
          }}
        >
          <div style={{
            background: '#1e1040',
            border: '1px solid #a78bfa44',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            boxShadow: '0 8px 32px rgba(167,139,250,0.2)',
          }}>
            {/* HAVI avatar */}
            <button
              onClick={onOpenHAVI}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #22d3ee)',
                border: 'none', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
              }}
              aria-label="Abrir HAVI"
            >
              🏛
            </button>
            <div style={{ flex: 1 }}>
              <p style={{
                margin: '0 0 6px', fontSize: '11px',
                color: '#a78bfa', fontWeight: 600, letterSpacing: '0.5px',
              }}>
                HAVI sugiere
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#e5e7eb', lineHeight: 1.5 }}>
                {suggestion}
              </p>
              <button
                onClick={onOpenHAVI}
                style={{
                  marginTop: '8px', background: 'none', border: 'none',
                  cursor: 'pointer', color: '#a78bfa', fontSize: '12px',
                  fontWeight: 600, padding: 0,
                }}
              >
                Hablar con HAVI →
              </button>
            </div>
            <button
              onClick={() => setVisible(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
              aria-label="Cerrar sugerencia"
            >
              <X size={14} color="#555" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
