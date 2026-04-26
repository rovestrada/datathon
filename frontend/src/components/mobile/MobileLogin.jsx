import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { EyeOff } from 'lucide-react'
import HaviLogo from '../HaviLogo'

const SLIDES = [
  {
    tag: 'Rendimientos',
    title: 'Tu dinero trabaja mientras duermes',
    body: 'Hey banco te ofrece hasta 15% anual en ahorro inmediato, sin plazos forzosos ni comisiones ocultas.',
    gradient: 'linear-gradient(135deg, #1e1040 0%, #2d1b69 100%)',
    accent: '#a78bfa',
  },
  {
    tag: 'Sin comisiones',
    title: 'Transferencias SPEI gratis las 24 hrs',
    body: 'Envía dinero a cualquier banco de México en segundos, sin costo y sin límite de operaciones al día.',
    gradient: 'linear-gradient(135deg, #0a2a1a 0%, #0d4a2a 100%)',
    accent: '#34d399',
  },
  {
    tag: 'Tarjeta Hey',
    title: 'Cashback en cada compra',
    body: 'Recibe de vuelta un porcentaje en cada transacción con tu Tarjeta de Crédito Hey. Úsala en línea o en tienda.',
    gradient: 'linear-gradient(135deg, #1a0a2a 0%, #3b0764 100%)',
    accent: '#e879f9',
  },
  {
    tag: 'HAVI IA',
    title: 'Tu asistente financiero inteligente',
    body: 'HAVI analiza tus finanzas en tiempo real, te avisa de oportunidades y te ayuda a alcanzar tus metas más rápido.',
    gradient: 'linear-gradient(135deg, #0a1a2a 0%, #1e3a5a 100%)',
    accent: '#38bdf8',
  },
  {
    tag: 'Seguridad',
    title: 'Bloquea tu tarjeta en un tap',
    body: 'Si pierdes tu tarjeta o ves algo sospechoso, bloquéala al instante desde la app y desbloquéala cuando quieras.',
    gradient: 'linear-gradient(135deg, #1a0a0a 0%, #4a1a1a 100%)',
    accent: '#f87171',
  },
]

export default function MobileLogin() {
  const { login } = useAuth()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [slideIdx, setSlideIdx] = useState(0)

  // Advance slide every 60 seconds
  useEffect(() => {
    const iv = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 60_000)
    return () => clearInterval(iv)
  }, [])

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
      background: '#0a0a12',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white',
    }}>
      {/* Top section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 28px 0' }}>
        {/* Welcome title */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ fontSize: '22px', fontWeight: 700, color: 'white', margin: '0 0 32px' }}
        >
          Bienvenido/a a HeyBanco
        </motion.p>

        {/* Password input */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          noValidate
        >
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type="password"
              inputMode="numeric"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Número de cliente"
              style={{
                width: '100%',
                padding: '18px 52px 18px 20px',
                borderRadius: '50px',
                border: '1px solid #333',
                background: '#1a1a2a',
                fontSize: '16px',
                color: '#aaa',
                outline: 'none',
                boxSizing: 'border-box',
                letterSpacing: '4px',
              }}
              aria-label="Número de cliente"
            />
            <div style={{
              position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
              width: '38px', height: '38px', borderRadius: '50%',
              background: '#2a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <EyeOff size={18} color="#888" />
            </div>
          </div>

          {/* Links row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', gap: '6px', flexWrap: 'wrap' }}>
            {['No soy yo', 'Olvidé mi contraseña', '⊞ Ver Token'].map(link => (
              <button key={link} type="button" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4db6e8', fontSize: '13px', padding: 0,
              }}>
                {link}
              </button>
            ))}
          </div>

          <motion.button
            type="submit"
            disabled={loading || !value.trim()}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'none', // hidden — tapping "Continuar" via Enter or face ID simulation
            }}
          />
        </motion.form>
      </div>

      {/* HAVI info slideshow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ margin: '0 0 16px', padding: '0 16px' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              background: SLIDES[slideIdx].gradient,
              borderRadius: '20px',
              padding: '20px',
              border: `1px solid ${SLIDES[slideIdx].accent}33`,
              boxShadow: `0 8px 32px ${SLIDES[slideIdx].accent}18`,
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <HaviLogo size={28} />
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
                textTransform: 'uppercase', color: SLIDES[slideIdx].accent,
              }}>
                {SLIDES[slideIdx].tag}
              </span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: 'white', lineHeight: 1.35 }}>
              {SLIDES[slideIdx].title}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
              {SLIDES[slideIdx].body}
            </p>
            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: '5px', marginTop: '14px' }}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  style={{
                    width: i === slideIdx ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: i === slideIdx ? SLIDES[slideIdx].accent : 'rgba(255,255,255,0.2)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all 0.3s',
                  }}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Continue button at bottom */}
      <div style={{ padding: '0 28px 48px' }}>
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', padding: '16px',
            borderRadius: '12px', border: 'none',
            background: loading || !value.trim() ? '#333' : '#1e3a8a',
            color: 'white', fontSize: '16px', fontWeight: 600,
            cursor: loading || !value.trim() ? 'default' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Verificando...' : 'Continuar'}
        </motion.button>
      </div>
    </div>
  )
}
