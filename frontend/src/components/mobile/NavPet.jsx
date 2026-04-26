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
  const fallRef   = useRef(false)
  const tpRef     = useRef(false)
  const facingRef = useRef(true)
  const stepsRef  = useRef(0)
  const idleRef   = useRef(0)
  const pausedRef = useRef(paused)
  facingRef.current = facingR
  pausedRef.current = paused

  // Freeze/unfreeze pet when paused changes
  useEffect(() => {
    if (paused) {
      setAnim('idle')
    } else if (!tpRef.current) {
      setAnim('walk')
    }
  }, [paused])

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

  // 8fps game loop — position only (GIF handles its own frame animation)
  useEffect(() => {
    const iv = setInterval(() => {
      if (tpRef.current) return
      if (pausedRef.current) return

      if (anim === 'idle') {
        idleRef.current++
        if (idleRef.current > 22) {
          setAnim('walk')
          idleRef.current = 0
        }
        return
      }

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

        // Avisar del cambio de posición y dirección
        onPositionChange?.({ x: next, facingR: facingRef.current }) 
        
        return next
      })
    }, 125)
    return () => clearInterval(iv)
  }, [anim, teleport])

  const gifSrc = getGifUrl(petType, variant, anim)

  return (
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
          onClick={onPress}
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
  )
})

export default NavPet
