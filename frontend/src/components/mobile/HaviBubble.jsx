import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useScreen } from '../../context/ScreenContext'
import { useAuth } from '../../context/AuthContext'

export default function HaviBubble({ screen, onOpenHAVI, bottomOffset = '88px', onDismiss, petX, facingR }) {
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

  const bubbleWidth = 180;
  const margin = 10;
  const petCenter = petX + 32;

  // Lógica de visibilidad dinámica basada en dirección
  // Si mira a la derecha (facingR=true), la caja sale a la derecha (necesita espacio a la derecha)
  // Si mira a la izquierda (facingR=false), la caja sale a la izquierda (necesita espacio a la izquierda)
  const hasSpace = facingR 
    ? (petCenter < (window.innerWidth - bubbleWidth - margin))
    : (petCenter > (bubbleWidth + margin));

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [screen])

  return (
    <AnimatePresence>
      {visible && hasSpace && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.1 }}
          style={{
            position: 'fixed',
            bottom: `calc(${bottomOffset} + 60px)`,
            left: `${petCenter}px`,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: facingR ? 'flex-start' : 'flex-end', // Alinear al ancla según dirección
            pointerEvents: 'none'
          }}
        >
          {/* El cuerpo de la burbuja */}
          <div 
            onClick={onOpenHAVI}
            style={{
              background: 'white',
              border: '2px solid black',
              padding: '8px 12px',
              position: 'relative',
              boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              width: `${bubbleWidth}px`,
              textAlign: 'center',
              // Margen dinámico para no tapar la flecha
              marginLeft: facingR ? '10px' : '0',
              marginRight: facingR ? '0' : '10px'
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setVisible(false); onDismiss?.() }}
              style={{
                position: 'absolute', top: '-10px', 
                right: facingR ? '-10px' : 'auto',
                left: facingR ? 'auto' : '-10px',
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

          {/* Flecha dinámica */}
          <div style={{
            marginLeft: facingR ? '10px' : '0',
            marginRight: facingR ? '0' : '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: facingR ? 'flex-start' : 'flex-end',
            marginTop: '-2px'
          }}>
            <div style={{
              width: 0, height: 0,
              borderLeft: facingR ? '1px solid transparent' : '12px solid transparent',
              borderRight: facingR ? '12px solid transparent' : '1px solid transparent',
              borderTop: '12px solid black',
            }} />
            <div style={{
              width: 0, height: 0,
              borderLeft: facingR ? '0px solid transparent' : '8px solid transparent',
              borderRight: facingR ? '8px solid transparent' : '0px solid transparent',
              borderTop: '8px solid white',
              marginTop: '-14px',
              marginLeft: facingR ? '2px' : '0',
              marginRight: facingR ? '0' : '2px'
            }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
