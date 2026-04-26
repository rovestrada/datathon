import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import HaviLogo from '../HaviLogo'

// Per-screen HAVI suggestions
const SUGGESTIONS = {
  pagos: '¿Sabías que puedes programar pagos automáticos? ¡Actívalo y olvídate de fechas!',
  transferir: 'Puedo ayudarte a hacer una transferencia SPEI sin comisiones. ¿A quién le vas a enviar?',
  buzon: 'Tienes notificaciones pendientes. ¿Quieres que te resuma las más importantes?',
  ajustes: '¿Necesitas bloquear tu tarjeta de emergencia? Puedo guiarte en segundos.',
  salud: 'Con tu ritmo de ahorro actual llegarás a $100 MXN en ~3 meses. ¿Quieres activar el redondeo automático para acelerar tu meta?',
  estado: 'Tu cuenta no registra gastos este mes. ¡Excelente! Considera mover parte de tu saldo a ahorro inmediato para generar más rendimiento.',
}

export default function HaviBubble({ screen, onOpenHAVI, bottomOffset = '88px', thoughtBubble = false, onDismiss }) {
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
          {/* Thought-bubble tail: three circles pointing toward the pet at the bottom */}
          {thoughtBubble && (
            <div style={{ display: 'flex', gap: '3px', paddingLeft: '20px', marginBottom: '5px', alignItems: 'flex-end' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1e1040', border: '1px solid #a78bfa44' }} />
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1e1040', border: '1px solid #a78bfa44' }} />
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1e1040', border: '1px solid #a78bfa44' }} />
            </div>
          )}
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
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'none',
                border: 'none', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0,
              }}
              aria-label="Abrir HAVI"
            >
              <HaviLogo size={30} />
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
              onClick={() => { setVisible(false); onDismiss?.() }}
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
