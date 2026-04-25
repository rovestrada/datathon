import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Mic } from 'lucide-react'

const BOT_RESPONSES = [
  'Entendido. ¿En qué más puedo ayudarte?',
  'Puedo ayudarte con transferencias, saldos y mucho más.',
  'Tu saldo disponible es $96.84 MXN. ¿Deseas más información?',
  'Recomiendo revisar tus movimientos para identificar gastos recurrentes.',
  'Para transferir dinero ve a la sección Transferir en el menú.',
  'Tu ahorro inmediato genera un rendimiento del 5%. ¡Excelente!',
  'Recuerda que tu Cuenta Hey no tiene comisiones por mantenimiento.',
  'Tu ahorro acumulado es $24.10 MXN. ¡Sigue adelante!',
  'Puedo ayudarte a programar pagos automáticos. ¿Te interesa?',
]

let msgId = 10

function now() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function personalGreeting(customerId) {
  const id = Number(customerId) || 0
  const name = customerId
    ? customerId.toString().charAt(0).toUpperCase() + customerId.toString().slice(1)
    : 'Usuario'

  if (id === 0) {
    return `¡Hola, ${name}! Soy HAVI, tu asistente financiero inteligente. ¿En qué puedo ayudarte hoy?`
  }
  if (id <= 10) {
    return `¡Hola, ${name}! Eres uno de nuestros primeros usuarios 🎉. Tu cuenta Hey no tiene comisiones y ya tienes $24.10 en ahorro inmediato generando rendimientos. ¿Qué te gustaría explorar?`
  }
  if (id <= 50) {
    return `¡Buenas, ${name}! Veo que llevas un tiempo con nosotros. Tu saldo disponible es $96.84 MXN y tu ahorro inmediato está creciendo. ¿Quieres que te ayude a optimizar tu dinero?`
  }
  if (id <= 200) {
    return `¡Hola, ${name}! Tu cuenta Hey está en buen estado. Tienes saldo disponible y un ahorro activo con rendimiento del 5% anual. ¿Hay algo en lo que pueda ayudarte?`
  }
  // Large ID number
  return `¡Hola, ${name}! Soy HAVI y estoy aquí para ayudarte con cualquier duda sobre tu cuenta, tus productos o tus metas de ahorro. ¿Por dónde empezamos?`
}

export default function MobileHAVI({ customerId, onBack }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'bot',
      text: personalGreeting(customerId),
      ts: now(),
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const send = useCallback(() => {
    const text = input.trim()
    if (!text || isTyping) return
    setMessages(prev => [...prev, { id: msgId++, from: 'user', text, ts: now() }])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      const reply = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)]
      setMessages(prev => [...prev, { id: msgId++, from: 'bot', text: reply, ts: now() }])
      setIsTyping(false)
    }, 700 + Math.random() * 600)
  }, [input, isTyping])

  const clearChat = () => {
    setMessages([{
      id: msgId++,
      from: 'bot',
      text: personalGreeting(customerId),
      ts: now(),
    }])
  }

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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        borderBottom: '1px solid #1a1a2a',
      }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute', left: '16px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'white', fontSize: '22px', padding: '4px',
          }}
          aria-label="Volver"
        >
          ‹
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'white' }}>HAVI</span>
          <ChevronDown size={14} color="#9ca3af" />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 8px' }}>
        {/* Date pill */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{
            background: 'white', color: '#111', fontSize: '12px',
            fontWeight: 600, padding: '4px 14px', borderRadius: '20px',
          }}>
            hoy
          </span>
        </div>

        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: msg.from === 'bot' ? 'row' : 'row-reverse',
              marginBottom: '12px',
            }}
          >
            <div style={{
              maxWidth: '78%',
              background: msg.from === 'bot' ? '#2a2a3a' : '#a78bfa',
              color: 'white',
              borderRadius: msg.from === 'bot' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
              padding: '12px 14px',
              fontSize: '14px',
              lineHeight: '1.55',
            }}>
              {msg.text}
              <div style={{
                textAlign: 'right', fontSize: '11px',
                color: 'rgba(255,255,255,0.45)', marginTop: '6px',
              }}>
                {msg.ts}
              </div>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            <div style={{
              background: '#2a2a3a', borderRadius: '18px 18px 18px 4px',
              padding: '12px 16px', display: 'flex', gap: '5px', alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a78bfa', display: 'block' }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Clear button */}
      <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
        <button
          onClick={clearChat}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4db6e8', fontSize: '13px' }}
        >
          Limpiar conversación
        </button>
      </div>

      {/* Input */}
      <div style={{ padding: '8px 16px 32px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#1a1a2a', borderRadius: '50px',
          border: '1px solid #2a2a3a',
          padding: '10px 14px 10px 20px',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Escribe tu pregunta aquí"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'white', fontSize: '15px',
            }}
            aria-label="Mensaje para HAVI"
            maxLength={500}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={send}
            style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: input.trim() ? '#a78bfa' : '#2a2a3a',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            aria-label="Enviar o micrófono"
          >
            <Mic size={17} color="white" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
