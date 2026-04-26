# CONTEXT_PHASE_4_CHAT.md — Chat Havi

> Lee CONTEXT.md global antes de este archivo.
> Prerequisito: Fase 1 (backend con POST /chat/message) y Fase 2 (AppShell con el placeholder de HaviChat).
> Esta fase tarda ~4 horas. Trabaja en `frontend/src/components/HaviChat.jsx`.

---

## Objetivo de esta fase

Reemplazar el placeholder de `HaviChat` con la implementación completa.
Al terminar:

- Un bottom sheet sube desde abajo con animación al abrirse.
- El primer mensaje de Havi ya aparece pre-cargado (es el `opening_message` del trigger).
- Los CTAs del trigger aparecen como botones clickeables bajo el primer mensaje.
- El usuario puede continuar la conversación libremente.
- Havi responde con contexto real del perfil del usuario (via Claude API en el backend).

---

## Diseño del componente

El chat ocupa el 80% de la altura de la pantalla como bottom sheet.
No es una página separada — es un overlay sobre el AppShell.

Estructura visual (de arriba a abajo dentro del sheet):
```
┌─────────────────────────────────┐
│ ← cerrar    Havi    [•••]       │  ← Header
├─────────────────────────────────┤
│                                 │
│  [msg Havi]  opening_message    │  ← Primer mensaje (pre-cargado)
│  [CTA1] [CTA2] [CTA3]          │  ← Botones de acción
│                                 │
│              [msg usuario]      │  ← Mensajes del historial
│  [respuesta Havi]               │
│  ...                            │
│                                 │
├─────────────────────────────────┤
│ [ escribe algo...        ] [→]  │  ← Input fijo abajo
└─────────────────────────────────┘
```

---

## C01 — Estructura y animación del bottom sheet

**`frontend/src/components/HaviChat.jsx`**:

```jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { chatAPI } from '../services/api'
import CTAButtons from './CTAButtons'
import styles from './HaviChat.module.css'
import { v4 as uuidv4 } from 'uuid'

// npm install uuid  — agregar a package.json
// Alternativa sin instalar: const uuidv4 = () => crypto.randomUUID()

export default function HaviChat({ userId, chatOpen, onClose }) {
  const sessionId = useRef(uuidv4())
  const messagesEndRef = useRef(null)

  // Estado inicial: el opening_message de Havi ya está en el historial
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: chatOpen?.opening_message || 'Hola, ¿en qué te ayudo?' }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [ctasDone, setCtasDone] = useState(false)  // ocultar CTAs tras primer respuesta

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setCtasDone(true)

    try {
      const { data } = await chatAPI.message(userId, sessionId.current, text)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Tuve un problema técnico. Intenta de nuevo en un momento.'
      }])
    } finally {
      setLoading(false)
    }
  }, [userId, loading])

  const handleCTA = useCallback((cta) => {
    if (cta === 'Ahora no') {
      sendMessage('Ahora no, gracias.')
    } else {
      sendMessage(cta)
    }
  }, [sendMessage])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Overlay oscuro */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Bottom sheet */}
      <div className={styles.sheet}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
          <div className={styles.headerInfo}>
            <div className={styles.avatar}>H</div>
            <div>
              <p className={styles.agentName}>Havi</p>
              <p className={styles.agentSub}>Tu asistente Hey Banco</p>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} className={`${styles.msg} ${styles[msg.role]}`}>
              {msg.role === 'assistant' && (
                <div className={styles.msgAvatar}>H</div>
              )}
              <div className={styles.bubble}>{msg.content}</div>
            </div>
          ))}

          {/* CTAs solo bajo el primer mensaje y si no se ha respondido aún */}
          {!ctasDone && chatOpen?.ctas && (
            <CTAButtons ctas={chatOpen.ctas} onSelect={handleCTA} />
          )}

          {/* Indicador de typing */}
          {loading && (
            <div className={`${styles.msg} ${styles.assistant}`}>
              <div className={styles.msgAvatar}>H</div>
              <div className={`${styles.bubble} ${styles.typing}`}>
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <input
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={loading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >→</button>
        </div>
      </div>
    </>
  )
}
```

---

## C02 — Estilos del chat

**`frontend/src/components/HaviChat.module.css`**:

```css
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 40; animation: fade .2s ease; }
.sheet {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 82dvh;
  background: var(--hb-bg);
  border-radius: 20px 20px 0 0;
  z-index: 50;
  display: flex; flex-direction: column;
  animation: slide .25s cubic-bezier(.34,1.56,.64,1);
  overflow: hidden;
}
@keyframes fade  { from { opacity: 0 } }
@keyframes slide { from { transform: translateY(100%) } }

/* Header */
.header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--hb-white); border-bottom: 1px solid var(--hb-border); flex-shrink: 0; }
.closeBtn { background: none; border: none; font-size: 18px; color: var(--hb-text-muted); cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.closeBtn:hover { background: var(--hb-border); }
.headerInfo { display: flex; align-items: center; gap: 10px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--hb-orange); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
.agentName { font-size: 14px; font-weight: 600; color: var(--hb-text); }
.agentSub { font-size: 12px; color: var(--hb-text-muted); }

/* Mensajes */
.messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.msg { display: flex; align-items: flex-end; gap: 8px; max-width: 88%; }
.assistant { align-self: flex-start; }
.user { align-self: flex-end; flex-direction: row-reverse; }
.msgAvatar { width: 28px; height: 28px; border-radius: 50%; background: var(--hb-orange-lt); color: var(--hb-orange); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; }
.bubble { padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; max-width: 240px; white-space: pre-wrap; word-break: break-word; }
.assistant .bubble { background: var(--hb-white); border: 1px solid var(--hb-border); color: var(--hb-text); border-radius: 4px 16px 16px 16px; }
.user .bubble { background: var(--hb-orange); color: white; border-radius: 16px 4px 16px 16px; }

/* Typing indicator */
.typing { display: flex; align-items: center; gap: 4px; padding: 12px 16px; }
.typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--hb-text-muted); animation: bounce 1s infinite; }
.typing span:nth-child(2) { animation-delay: .15s; }
.typing span:nth-child(3) { animation-delay: .3s; }
@keyframes bounce { 0%,60%,100% { transform: translateY(0) } 30% { transform: translateY(-6px) } }

/* Input */
.inputArea { display: flex; gap: 8px; padding: 12px 16px; background: var(--hb-white); border-top: 1px solid var(--hb-border); flex-shrink: 0; }
.input { flex: 1; padding: 10px 14px; border: 1px solid var(--hb-border); border-radius: 24px; font-size: 14px; color: var(--hb-text); outline: none; background: var(--hb-bg); transition: border-color .2s; }
.input:focus { border-color: var(--hb-orange); }
.sendBtn { width: 40px; height: 40px; border-radius: 50%; background: var(--hb-orange); color: white; border: none; font-size: 18px; cursor: pointer; flex-shrink: 0; transition: opacity .2s; }
.sendBtn:disabled { opacity: .4; cursor: not-allowed; }
```

---

## C03 — Componente CTAButtons

**`frontend/src/components/CTAButtons.jsx`**:

```jsx
import styles from './CTAButtons.module.css'

export default function CTAButtons({ ctas, onSelect }) {
  return (
    <div className={styles.container}>
      {ctas.map(cta => (
        <button
          key={cta}
          className={`${styles.btn} ${cta === 'Ahora no' ? styles.dismiss : styles.action}`}
          onClick={() => onSelect(cta)}
        >
          {cta}
        </button>
      ))}
    </div>
  )
}
```

**`frontend/src/components/CTAButtons.module.css`**:
```css
.container { display: flex; flex-wrap: wrap; gap: 8px; margin-left: 36px; margin-top: -4px; }
.btn { padding: 8px 14px; border-radius: 20px; font-size: 13px; cursor: pointer; border: 1.5px solid; transition: all .15s; }
.action { background: var(--hb-orange-lt); color: var(--hb-orange); border-color: var(--hb-orange); }
.action:hover { background: var(--hb-orange); color: white; }
.dismiss { background: transparent; color: var(--hb-text-muted); border-color: var(--hb-border); }
.dismiss:hover { background: var(--hb-border); }
```

---

## C04 — Instalar uuid

```bash
cd frontend
npm install uuid
```

Si prefieres no instalar ningún paquete extra, usa `crypto.randomUUID()` directamente
(disponible en todos los browsers modernos):
```js
const sessionId = useRef(crypto.randomUUID())
```

---

## Nota sobre el system prompt de Havi

El system prompt que hace que Havi "sepa quién eres" está implementado en el backend
(`api/services/chat_service.py`, función `_build_system_prompt`). El frontend no
necesita hacer nada especial — solo enviar `user_id` y `session_id` en cada mensaje.

Lo que hace que el chat sea "accurate" con preguntas transaccionales:
- El system prompt incluye las `recent_transactions` del perfil del usuario.
- El sistema le dice a Havi exactamente qué trigger activó la conversación.
- El historial de mensajes (`_sessions`) se acumula por `session_id`, así Havi
  recuerda lo que se dijo antes en la misma sesión.

Si quieres que Havi pueda responder preguntas más específicas (ej. "¿cuánto gasté en
restaurantes este mes?"), el equipo de DS puede enriquecer el `user_profiles.json` con
más campos y el `_build_system_prompt` puede incluirlos. El frontend no cambia.

---

## Checklist de salida de esta fase

- [ ] El chat abre con animación de slide desde abajo
- [ ] El `opening_message` aparece como primer mensaje de Havi al abrir
- [ ] Los 3 CTAs aparecen como botones bajo el primer mensaje
- [ ] Al hacer click en un CTA, se envía como mensaje y los CTAs desaparecen
- [ ] El typing indicator aparece mientras Havi "piensa"
- [ ] Havi responde con contexto del perfil (menciona cosas del trigger)
- [ ] El historial de la sesión se mantiene al seguir conversando
- [ ] Cambiar de usuario en el login y reabrir el chat muestra un opening_message diferente
- [ ] El chat cierra al hacer click en el overlay o en el botón ✕
- [ ] El input con Enter envía el mensaje

---

## Lo que NO hacer en esta fase

- No implementar historial persistente entre sesiones — `sessionStorage` si acaso,
  pero no es necesario para el demo.
- No implementar markdown en los mensajes de Havi — el system prompt ya le indica
  que responda en texto plano.
- No mostrar el `session_id` al usuario — es solo un identificador interno.
- No cachear las respuestas — cada mensaje llama al backend en tiempo real.
