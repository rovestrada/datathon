import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Landmark, Loader2 } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const BOT_RESPONSES = [
  'Entendido. ¿En qué más puedo ayudarte?',
  'Excelente pregunta. Puedo ayudarte con transferencias, saldos y más.',
  'Tu saldo disponible es $96.84 MXN. ¿Deseas más información?',
  'Recomiendo revisar tus movimientos recientes para identificar gastos.',
  'Para transferir dinero ve a la sección Transferencias del menú.',
  'Tu ahorro inmediato está generando un rendimiento del 5%. ¡Bien hecho!',
  'Puedo ayudarte a programar pagos automáticos. ¿Te interesa?',
  'Recuerda que tu Cuenta Hey no tiene comisiones por mantenimiento.',
  'Tu ahorro acumulado es $24.10 MXN. ¡Sigue adelante!',
]

const WELCOME_MESSAGE = (customerId) => ({
  id: 'welcome',
  from: 'bot',
  text: `¡Hola, Usuario #${customerId}! Soy HAVI, tu asistente financiero inteligente de hey, banco. ¿En qué puedo ayudarte hoy?`,
  ts: Date.now(),
})

let msgCounter = 1

// ─── Bot typing indicator ─────────────────────────────────────────────────────

function BotTyping() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: '#a78bfa', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Landmark size={14} color="white" />
      </div>
      <div style={{
        padding: '10px 14px', background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '16px', borderBottomLeftRadius: '4px',
        display: 'flex', gap: '5px', alignItems: 'center',
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
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isBot = msg.from === 'bot'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex', alignItems: 'flex-end', gap: '10px',
        flexDirection: isBot ? 'row' : 'row-reverse',
      }}
    >
      {isBot && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: '#a78bfa', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Landmark size={14} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: '68%',
        padding: '10px 14px',
        fontSize: '14px',
        lineHeight: '1.55',
        borderRadius: '16px',
        borderBottomLeftRadius: isBot ? '4px' : '16px',
        borderBottomRightRadius: isBot ? '16px' : '4px',
        background: isBot ? 'white' : '#a78bfa',
        color: isBot ? '#111' : 'white',
        border: isBot ? '1px solid #e5e7eb' : 'none',
        fontWeight: isBot ? 400 : 500,
        boxShadow: isBot ? '0 1px 3px rgba(0,0,0,0.04)' : '0 2px 8px rgba(167,139,250,0.3)',
      }}>
        {msg.text}
      </div>
    </motion.div>
  )
}

// ─── Chatbot panel ────────────────────────────────────────────────────────────

const ChatbotHAVI = memo(function ChatbotHAVI({ isOpen, onClose, customerId }) {
  const [messages, setMessages] = useState(() => [WELCOME_MESSAGE(customerId)])
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef          = useRef(null)
  const inputRef                = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text) return

    const userMsg = { id: msgCounter++, from: 'user', text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const delay = 350 + Math.random() * 500
    setTimeout(() => {
      const botText = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)]
      setIsTyping(false)
      setMessages(prev => [...prev, { id: msgCounter++, from: 'bot', text: botText, ts: Date.now() }])
    }, delay)
  }, [input])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="chat-window"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed z-50 flex flex-col"
          style={{
            bottom: '88px',
            right: '16px',
            width: 'min(360px, calc(100vw - 32px))',
            height: 'min(520px, calc(100vh - 120px))',
            background: '#0d0d0d',
            border: '1px solid #222',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.08)',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-label="Chat con HAVI"
          aria-modal="true"
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ background: '#111', borderBottom: '1px solid #1a1a1a' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#1a1040', border: '1px solid #a78bfa44' }}>
                <Landmark size={16} color="#a78bfa" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">HAVI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22d3ee' }} />
                  <span className="text-xs" style={{ color: '#555' }}>Asistente financiero</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors duration-150 hover:bg-white/5"
                aria-label="Cerrar chat"
              >
                <X size={16} style={{ color: '#666' }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {isTyping && <BotTyping />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 flex-shrink-0"
              style={{ background: '#111', borderTop: '1px solid #1a1a1a' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu consulta…"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                  aria-label="Mensaje para HAVI"
                  maxLength={500}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-40"
                  style={{ background: input.trim() ? '#a78bfa' : '#222' }}
                  aria-label="Enviar mensaje"
                >
                  {isTyping
                    ? <Loader2 size={14} color="#888" className="animate-spin" />
                    : <Send size={14} color={input.trim() ? '#fff' : '#555'} />
                  }
                </motion.button>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

// ─── Floating toggle button ───────────────────────────────────────────────────

export function ChatToggleButton({ isOpen, onClick, unread }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="fixed z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
      style={{
        bottom: '24px', right: '24px',
        background: isOpen ? '#1a1a1a' : '#a78bfa',
        border: isOpen ? '1px solid #2a2a2a' : 'none',
        boxShadow: isOpen ? 'none' : '0 8px 24px rgba(167,139,250,0.4)',
      }}
      aria-label={isOpen ? 'Cerrar HAVI' : 'Abrir asistente HAVI'}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
            <X size={22} color="#aaa" />
          </motion.span>
        ) : (
          <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
            <Landmark size={22} color="#fff" />
          </motion.span>
        )}
      </AnimatePresence>
      {!isOpen && unread > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-black"
          style={{ background: '#22d3ee' }}
        >
          {unread}
        </motion.span>
      )}
    </motion.button>
  )
}

export default ChatbotHAVI
