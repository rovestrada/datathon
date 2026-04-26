import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Send, Loader2 } from 'lucide-react'
import HaviLogo from '../HaviLogo'
import { getGifUrl, PET_TYPES } from './petSprites'
import { API_BASE } from '../../utils/apiConfig'
import React from 'react'

let msgId = 10

function now() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function MobileHAVI({ customerId, userName, token, chatOpenData, petEnabled, petType, petVariant, originScreen = 'inicio', bubbleOpenMessage = null, bubbleOpenCtas = null, onBack, onNavigate }) {
  const sessionId = useRef(crypto.randomUUID())
  const [ctasDone, setCtasDone] = useState(false)

  const firstName = userName ? userName.split(' ')[0] : null
  const greeting = firstName
    ? `¡Hola, ${firstName}! Soy HAVI. ¿En qué puedo ayudarte?`
    : `¡Hola! Soy HAVI. ¿En qué puedo ayudarte?`

  const triggerMessage = chatOpenData?.opening_message
    ? chatOpenData.opening_message.replace('¡Hola!', firstName ? `¡Hola, ${firstName}!` : '¡Hola!')
    : greeting

  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      from: 'bot',
      // Si el usuario abrió desde la burbuja, usar ese mensaje; si no, usar el trigger
      text: bubbleOpenMessage ?? triggerMessage,
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

  const send = useCallback(async (textOverride) => {
    const text = (typeof textOverride === 'string' ? textOverride : input).trim()
    if (!text || isTyping) return

    setMessages(prev => [...prev, { id: msgId++, from: 'user', text, ts: now() }])
    setInput('')
    setIsTyping(true)
    setCtasDone(true)

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          user_id: customerId, 
          session_id: sessionId.current, 
          message: text,
          current_screen: originScreen
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        id: msgId++,
        from: 'bot',
        ts: now(),
        text: res.ok ? data.reply : 'Lo siento, tuve un problema técnico.',
        navAction: data.navigation_action ?? null,
        quickReplies: (res.ok && data.quick_replies?.length) ? data.quick_replies : null,
      }])
    } catch {
      setMessages(prev => [...prev, { 
        id: msgId++, 
        from: 'bot', 
        ts: now(),
        text: 'Sin conexión con el servidor.' 
      }])
    } finally {
      setIsTyping(false)
    }
  }, [input, isTyping, customerId, token])

  const clearChat = () => {
    sessionId.current = crypto.randomUUID()
    setCtasDone(false)
    setMessages([{
      id: msgId++,
      from: 'bot',
      text: chatOpenData?.opening_message
        ? chatOpenData.opening_message.replace('¡Hola!', firstName ? `¡Hola, ${firstName}!` : '¡Hola!')
        : greeting,
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
          {petEnabled ? (
            <img
              src={getGifUrl(petType, petVariant || PET_TYPES[petType]?.defaultVariant, 'idle')}
              alt="pet"
              style={{ width: 32, height: 32, imageRendering: 'pixelated' }}
            />
          ) : (
            <HaviLogo size={26} />
          )}
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

        {messages.map((msg, i) => (
          <React.Fragment key={msg.id}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                flexDirection: msg.from === 'bot' ? 'row' : 'row-reverse',
                marginBottom: (i === 0 && !ctasDone && chatOpenData?.ctas) ? '8px' : '12px',
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
                
                {msg.navAction && (
                  <button 
                    onClick={() => onNavigate(msg.navAction.screen)}
                    style={{
                      marginTop: '12px', width: '100%', padding: '10px',
                      borderRadius: '12px', background: 'white', color: '#1e1040',
                      border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    {msg.navAction.label} →
                  </button>
                )}

                <div style={{
                  textAlign: 'right', fontSize: '11px',
                  color: 'rgba(255,255,255,0.45)', marginTop: '6px',
                }}>
                  {msg.ts}
                </div>
              </div>
            </motion.div>

            {/* CTAs bajo el primer mensaje */}
            {i === 0 && !ctasDone && (bubbleOpenCtas || chatOpenData?.ctas) && (
              <div style={{
                display:'flex', flexWrap:'wrap', gap:'8px',
                marginBottom: '20px', paddingLeft: '4px'
              }}>
                {(bubbleOpenCtas ?? chatOpenData.ctas).map(cta => (
                  <button key={cta} onClick={() => send(cta)} style={{
                    padding:'8px 16px', borderRadius:'20px', fontSize:'13px', cursor:'pointer',
                    background: cta === 'Ahora no' ? 'transparent' : 'rgba(167,139,250,0.15)',
                    color: cta === 'Ahora no' ? '#9ca3af' : '#a78bfa',
                    border: `1px solid ${cta === 'Ahora no' ? '#333' : '#a78bfa55'}`,
                  }}>{cta}</button>
                ))}
              </div>
            )}

            {/* Quick replies bajo el último mensaje del bot */}
            {msg.from === 'bot' && i === messages.length - 1 && !isTyping && msg.quickReplies?.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px',
                marginBottom: '16px', paddingLeft: '4px',
              }}>
                {msg.quickReplies.map(qr => (
                  <button key={qr} onClick={() => send(qr)} style={{
                    padding: '7px 15px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                    background: 'rgba(167,139,250,0.12)',
                    color: '#a78bfa',
                    border: '1px solid #a78bfa44',
                    transition: 'background 0.15s',
                  }}>{qr}</button>
                ))}
              </div>
            )}
          </React.Fragment>
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
            aria-label="Enviar"
          >
            {isTyping 
              ? <Loader2 size={18} color="white" className="animate-spin" />
              : <Send size={17} color="white" />
            }
          </motion.button>
        </div>
      </div>
    </div>
  )
}
