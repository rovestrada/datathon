import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
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
      background: '#f0f2f4',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '400px', padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 700, fontStyle: 'italic', color: '#111', letterSpacing: '-1px' }}>
            hey
          </span>
          <span style={{ fontSize: '36px', fontWeight: 700, color: '#111' }}>,</span>
          <span style={{ fontSize: '32px', fontWeight: 400, color: '#111', marginLeft: '6px', letterSpacing: '-0.5px' }}>
            banco
          </span>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '28px 28px 32px',
        }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111' }}>Iniciar sesión</h2>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#111', display: 'block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d1d5db', display: 'block' }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Escribe tu usuario
            </label>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                type={show ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="username"
                value={value}
                onChange={e => setValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#eef0f4',
                  fontSize: '15px',
                  color: '#111',
                  outline: 'none',
                  boxSizing: 'border-box',
                  letterSpacing: '3px',
                }}
                aria-label="Usuario"
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  color: '#9ca3af',
                }}
                aria-label={show ? 'Ocultar' : 'Mostrar'}
              >
                {show ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !value.trim()}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '8px', border: 'none',
                background: loading || !value.trim() ? '#555' : '#111',
                color: 'white', fontSize: '15px', fontWeight: 600,
                cursor: loading || !value.trim() ? 'default' : 'pointer',
                transition: 'background 0.2s',
                float: 'right',
              }}
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </motion.button>
          </form>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 10px' }}>
            Si lo necesitas, llámanos. Con gusto te atenderemos.
          </p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
            (81) 4392–2626
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            (81 HEYBANCO)
          </p>
        </div>
      </motion.div>

      {/* Bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '10px 20px', display: 'flex', justifyContent: 'space-between',
        fontSize: '11px', color: '#aaa',
      }}>
        <span>2.4.5-2-1776988463989</span>
        <span>La IP desde la que te estás conectando es: 131.178.102.152</span>
      </div>
    </div>
  )
}

