import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { EyeOff } from 'lucide-react'

export default function MobileLogin() {
  const { login } = useAuth()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

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
        {/* Masked name placeholder */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ fontSize: '26px', fontWeight: 700, color: 'white', margin: '0 0 32px', letterSpacing: '2px' }}
        >
          B******* S********* A***** R****
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

      {/* Promo banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{
          margin: '0 0 16px',
          background: 'linear-gradient(135deg, #c05e10 0%, #e07820 100%)',
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}
      >
        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Súper<em style={{ fontStyle: 'italic', fontWeight: 700 }}>cashback</em>
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
          Regístrate en el buzón de tu app y recibe 10% de vuelta.
        </p>
        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
          *Válido con la anualidad de tu Tarjeta de Crédito Hey.
        </p>
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
