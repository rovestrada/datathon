import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getGifUrl, PET_TYPES } from './petSprites'

const NAV_H  = 72
const MARGIN = 6

// GIF sprite is 32×32 logical pixels in the source files
const PET_W = 64   // display size (upscaled 2×)
const PET_H = 64

function bottomY(navVisible) {
  return window.innerHeight - (navVisible ? NAV_H : 0) - MARGIN - PET_H
}

const NavPet = memo(function NavPet({ 
  petType = 'panda', 
  petVariant, 
  navVisible = true, 
  paused = false, 
  notification = null,
  onNotificationDismiss,
  onPress,
  onPositionChange
}) {
  const typeMeta = PET_TYPES[petType] || PET_TYPES.panda
  const variant  = petVariant || typeMeta.defaultVariant

  const [x,       setX]       = useState(40)
  const [topY,    setTopY]    = useState(() => bottomY(navVisible))
  const [anim,    setAnim]    = useState('walk')  // 'walk' | 'idle' | 'run'
  const [facingR, setFacingR] = useState(true)
  const [visible, setVisible] = useState(true)
  const [tpKey,   setTpKey]   = useState(0)
  const fallRef        = useRef(false)
  const tpRef          = useRef(false)
  const facingRef      = useRef(true)
  const stepsRef       = useRef(0)
  const idleRef        = useRef(0)
  const pausedRef      = useRef(paused)
  const notifRef       = useRef(!!notification)
  facingRef.current    = facingR
  pausedRef.current    = paused
  notifRef.current     = !!notification

  const effectivePaused = paused || !!notification

  // Freeze/unfreeze pet when paused or notification changes
  useEffect(() => {
    if (effectivePaused) {
      setAnim('idle')
    } else if (!tpRef.current) {
      setAnim('walk')
    }
  }, [effectivePaused])

  useEffect(() => {
    if (!tpRef.current) setTopY(bottomY(navVisible))
  }, [navVisible])

  const teleport = useCallback(() => {
    if (tpRef.current) return
    tpRef.current = true
    setAnim('run')
    setVisible(false)
    setTimeout(() => {
      setX(Math.floor(Math.random() * (window.innerWidth - PET_W - 20)) + 10)
      setTopY(bottomY(navVisible))
      setFacingR(Math.random() > 0.5)
      stepsRef.current = 0
      fallRef.current = true
      setTpKey(k => k + 1)
      setVisible(true)
      setAnim('walk')
      setTimeout(() => { fallRef.current = false; tpRef.current = false }, 900)
    }, 320)
  }, [navVisible])

  // 8fps game loop — position only
  useEffect(() => {
    const iv = setInterval(() => {
      if (tpRef.current) return
      if (pausedRef.current || notifRef.current) return

      if (anim === 'idle') {
        idleRef.current++
        if (idleRef.current > 22) {
          setAnim('walk')
          idleRef.current = 0
        }
        return
      }

      let currentX = 0;
      setX(prev => {
        const w = window.innerWidth
        const speed = facingRef.current ? 2 : -2
        const next = prev + speed

        if (next > w - PET_W - 10) {
          if (Math.random() < 0.35) { teleport(); return prev }
          setFacingR(false); stepsRef.current = 0; return prev
        }
        if (next < 10) {
          if (Math.random() < 0.35) { teleport(); return prev }
          setFacingR(true); stepsRef.current = 0; return prev
        }

        stepsRef.current++
        if (stepsRef.current > 60 && Math.random() < 0.02) {
          setAnim('idle'); idleRef.current = 0; stepsRef.current = 0
        }
        if (stepsRef.current > 120 && Math.random() < 0.009) teleport()

        currentX = next;
        return next
      })

      // NOTIFICACIÓN ASÍNCRONA: Evita el error de "Cannot update during render"
      if (onPositionChange && currentX !== 0) {
        window.requestAnimationFrame(() => {
          onPositionChange({ x: currentX, facingR: facingRef.current })
        })
      }
    }, 125)
    return () => clearInterval(iv)
  }, [anim, teleport, onPositionChange])

  const gifSrc = getGifUrl(petType, variant, anim)

  // Notification bubble: clamp to viewport so it never overflows
  const BUBBLE_W   = 180
  const petCenterX = x + PET_W / 2
  const bubbleLeft = Math.max(8, Math.min(window.innerWidth - BUBBLE_W - 8, petCenterX - BUBBLE_W / 2))
  const bubbleTop  = Math.max(8, topY - 90)
  // Arrow X relative to bubble left edge, pointing at pet center
  const arrowLeft  = Math.max(8, Math.min(BUBBLE_W - 20, petCenterX - bubbleLeft - 7))

  return (
    <>
      {/* Notification bubble — fixed, screen-clamped */}
      <AnimatePresence>
        {notification && visible && (
          <motion.div
            key="notif-bubble"
            initial={{ opacity: 0, y: 6, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.88 }}
            transition={{ duration: 0.15 }}
            style={{
              position:     'fixed',
              top:          `${bubbleTop}px`,
              left:         `${bubbleLeft}px`,
              zIndex:       46,
              width:        `${BUBBLE_W}px`,
              background:   '#fff',
              color:        '#111',
              border:       '2px solid #111',
              borderRadius: '10px',
              padding:      '8px 10px',
              fontSize:     '11px',
              fontFamily:   '"Courier New", Courier, monospace',
              fontWeight:   'bold',
              textAlign:    'center',
              lineHeight:   '1.4',
              wordBreak:    'break-word',
              pointerEvents: 'auto',
              cursor:       'pointer',
            }}
            onClick={() => { onNotificationDismiss?.(); onPress?.() }}
          >
            {notification}
            {/* Bubble tail pointing down at pet */}
            <span style={{
              position:    'absolute',
              bottom:      '-10px',
              left:        `${arrowLeft}px`,
              width:       0, height: 0,
              borderTop:   '8px solid #111',
              borderRight: '7px solid transparent',
              borderLeft:  '7px solid transparent',
            }} />
            <span style={{
              position:    'absolute',
              bottom:      '-6px',
              left:        `${arrowLeft + 2}px`,
              width:       0, height: 0,
              borderTop:   '6px solid #fff',
              borderRight: '5px solid transparent',
              borderLeft:  '5px solid transparent',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <motion.div
            key={tpKey}
            initial={
              fallRef.current
                ? { opacity: 0, y: -(window.innerHeight + PET_H) }
                : { opacity: 0, scale: 0.2 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0, transition: { duration: 0.18 } }}
            transition={
              fallRef.current
                ? { type: 'spring', stiffness: 200, damping: 18, opacity: { duration: 0.1 } }
                : { duration: 0.2 }
            }
            style={{ position: 'fixed', left: x, top: topY, zIndex: 45, cursor: 'pointer' }}
            onClick={notification ? () => { onNotificationDismiss?.(); onPress?.() } : onPress}
            title="¡Toca para hablar con HAVI!"
          >
            <img
              src={gifSrc}
              width={PET_W}
              height={PET_H}
              alt={typeMeta.label}
              style={{
                imageRendering: 'pixelated',
                transform: !facingR ? 'scaleX(-1)' : 'none',
                display: 'block',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})

export default NavPet
