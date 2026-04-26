import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useScreen } from '../../context/ScreenContext'
import { useAuth } from '../../context/AuthContext'

export default function HaviBubble({ screen, onOpenHAVI, bottomOffset = '88px', onDismiss, onShow, petX, facingR }) {
  const { screenCache } = useScreen()
  const { chatOpenData } = useAuth()
  const [visible, setVisible] = useState(false)

  const SCREEN_MESSAGES = {
    inicio:     chatOpenData?.opening_message ?? '¿En qué te ayudo hoy? 👋',
    salud:      '¡Tu score financiero está subiendo! 📊',
    estado:     'Veo que no has tenido cargos duplicados. ¡Bien! 🔍',
    pagos:      '¿Quieres que revise tus fechas de vencimiento? 📅',
    transferir: '¿A quién le enviaremos dinero hoy? 💸',
    buzon:      '¡Tienes un aviso importante de Hey! 💡',
    cards:      'Tu tarjeta está lista para usarse 💳',
  }

  const screenData = screenCache[screen]
  const message = screenData?.havi_context_short ?? SCREEN_MESSAGES[screen] ?? '¡Hola! 👋'

  const BUBBLE_W  = 180
  const PET_W     = 64
  const PADDING   = 8

  // Pet center X
  const petCenter = petX + PET_W / 2

  // Preferred left edge: to the right of pet when facing right, to the left when facing left
  const preferredLeft = facingR
    ? petCenter + 6
    : petCenter - BUBBLE_W - 6

  // Clamp so the bubble never overflows viewport
  const clampedLeft = Math.max(
    PADDING,
    Math.min(window.innerWidth - BUBBLE_W - PADDING, preferredLeft)
  )

  // Arrow X relative to clampedLeft, pointing at pet center
  const arrowLeft = Math.max(8, Math.min(BUBBLE_W - 20, petCenter - clampedLeft - 7))

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => {
      setVisible(true)
      onShow?.()
    }, 1500)
    return () => clearTimeout(t)
  }, [screen])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.1 }}
          style={{
            position: 'fixed',
            bottom: `calc(${bottomOffset} + 60px)`,
            left: `${clampedLeft}px`,
            width: `${BUBBLE_W}px`,
            zIndex: 40,
            pointerEvents: 'none',
            transition: 'left 0.15s linear',
          }}
        >
          {/* Bubble body */}
          <div
            onClick={() => onOpenHAVI?.(message)}
            style={{
              background: 'white',
              border: '2px solid black',
              padding: '8px 12px',
              position: 'relative',
              boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              textAlign: 'center',
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setVisible(false); onDismiss?.() }}
              style={{
                position: 'absolute', top: '-10px', right: '-10px',
                background: 'white', border: '2px solid black',
                width: '18px', height: '18px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                padding: 0
              }}
            >
              <X size={10} color="black" strokeWidth={3} />
            </button>

            <p style={{
              margin: 0,
              color: 'black',
              fontSize: '10.5px',
              fontFamily: '"Courier New", Courier, monospace',
              fontWeight: 'bold',
              lineHeight: 1.2,
              wordWrap: 'break-word'
            }}>
              {message}
            </p>
          </div>

          {/* Arrow pointing down toward pet */}
          <div style={{ position: 'relative', height: '12px', marginTop: '-2px' }}>
            <div style={{
              position: 'absolute',
              left: `${arrowLeft}px`,
              width: 0, height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '12px solid black',
            }} />
            <div style={{
              position: 'absolute',
              left: `${arrowLeft + 2}px`,
              top: '0px',
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '9px solid white',
            }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
