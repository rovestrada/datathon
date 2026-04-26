# CONTEXT_PHASE_4_HAVI_OMNIPRESENCE.md — HAVI Omnipresente
## Havi 360 · Hey Banco Hackathon

> Lee CONTEXT.md global antes de este archivo.
> Prerequisito: Fases 2 y 3 completas (ScreenContext, screen_data, navigation_action en API).
> Esta fase es la más visual — es lo que hace el "wow moment" del pitch.

---

## Objetivo

Que HAVI aparezca y sea útil en TODAS las pantallas, no solo en la pantalla del chat:

1. **HaviBubble contextual** — el speech bubble cambia su mensaje según la pantalla
2. **Navegación por intent** — el frontend consume `navigation_action` y mueve al usuario
3. **HAVI en pantallas secundarias** — botón/acceso a HAVI visible en todas las vistas

---

## H01 — HaviBubble contextual y bidireccional

HaviBubble replica la estética de `vscode-pets`. Es **direccionalmente consciente**: cambia su diseño (mirroring) y posición según hacia dónde mire la mascota.

### Lógica de Seguimiento (Sync)
1. `NavPet.jsx` reporta posición `(x)` y dirección `(facingR)` vía el callback `onPositionChange`.
2. `MobileApp.jsx` sincroniza estos valores en estados globales (`petX`, `petFacingR`).
3. `HaviBubble.jsx` se posiciona dinámicamente sobre la cabeza de la mascota.

### Smart Design & Overflow
- **Mirroring:** Si `facingR` es true, la burbuja aparece a la derecha del pet con la flecha en la esquina inferior izquierda. Si es false, se invierte.
- **Auto-Hide (Clamp):** Para evitar que el texto se corte en los bordes de la pantalla, la burbuja se oculta automáticamente si no hay espacio suficiente para renderizar la caja completa (`hasSpace`).
- **Pixel-Art Style:** Borde negro sólido de 2px, fuente `"Courier New"` negrita, y botón de cierre flotante.

```jsx
// Posicionamiento dinámico simplificado
const petCenter = petX + 32;
const hasSpace = facingR 
  ? (petCenter < (window.innerWidth - bubbleWidth - margin))
  : (petCenter > (bubbleWidth + margin));
```

**Agregar `havi_context_short` al screen_data JSON (DS):**
Es un string de máximo 60 chars para mostrar en el bubble. Ejemplo:
```json
"havi_context_short": "Tu crédito está al 55% 💳"
```

---

## H02 — Consumir navigation_action en MobileHAVI

Cuando HAVI devuelve `navigation_action`, el frontend navega automáticamente.

```jsx
// En MobileHAVI.jsx — actualizar sendMessage

// Props adicionales necesarias:
// onNavigate: (screen) => void  — recibe goTo de MobileApp

const sendMessage = async (textOverride) => {
  const text = (textOverride ?? inputValue).trim()
  if (!text || isTyping) return

  setMessages(prev => [...prev, { id: Date.now(), from: 'user', text, ts: Date.now() }])
  setInputValue('')
  setIsTyping(true)
  setCtasDone(true)

  try {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: customerId,
        session_id: sessionId.current,
        message: text,
        current_screen: 'havi',
      }),
    })
    const data = await res.json()

    setMessages(prev => [...prev, {
      id: Date.now() + 1, from: 'bot', ts: Date.now(),
      text: data.reply,
      navigation_action: data.navigation_action ?? null,  // ← guardar en el mensaje
    }])

    // Si hay navigation_action, mostrar botón de navegación en el mensaje
    // (ver H03 — no navegar automáticamente, dar al usuario el control)

  } catch {
    setMessages(prev => [...prev, {
      id: Date.now() + 1, from: 'bot', ts: Date.now(),
      text: 'Sin conexión con el servidor.',
    }])
  } finally {
    setIsTyping(false)
  }
}
```

---

## H03 — Botón de navegación en mensajes de HAVI

Cuando un mensaje de HAVI incluye `navigation_action`, renderizar un botón
de acceso directo bajo el mensaje.

```jsx
// Actualizar el componente de mensaje en MobileHAVI
// (el que renderiza cada burbuja del bot)

function BotMessage({ msg, onNavigate }) {
  return (
    <div>
      {/* Burbuja existente — sin cambios */}
      <div className="bot-bubble">{msg.text}</div>

      {/* Botón de navegación directa — NUEVO */}
      {msg.navigation_action && onNavigate && (
        <button
          onClick={() => onNavigate(msg.navigation_action.screen)}
          style={{
            marginTop: '8px',
            marginLeft: '40px',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            cursor: 'pointer',
            border: '1.5px solid #a78bfa66',
            background: 'rgba(167,139,250,0.15)',
            color: '#a78bfa',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {msg.navigation_action.label} →
        </button>
      )}
    </div>
  )
}
```

**Pasar onNavigate desde MobileApp:**
```jsx
// En MobileApp.jsx:
{screen === 'havi' && (
  <MobileHAVI
    customerId={customerId}
    onBack={goBack}
    onNavigate={goTo}   // ← pasar goTo como onNavigate
  />
)}
```

---

## H04 — HAVI accesible desde cualquier pantalla

En las pantallas secundarias donde no hay navbar (salud, estado), HAVI debe
ser accesible via el botón de esquina. El equipo ya tiene `showHAVICorner`
implementado en MobileApp — solo verificar que funciona en todas las pantallas
relevantes.

Para las pantallas con navbar (inicio, pagos, transferir, buzón), el botón
central HAVI de la navbar ya sirve como acceso.

**Verificar en MobileApp.jsx:**
```jsx
// Confirmar que esta lógica está correcta:
const showHAVICorner = !petEnabled && isFreeScreen
// isFreeScreen incluye: salud, estado

// Si petEnabled es true, la mascota hace el trabajo de acceso a HAVI
// Si petEnabled es false, el botón de esquina aparece
```

---

## H05 — HaviBubble auto-aparece al entrar a pantallas clave

En la pantalla de salud financiera y estado de cuenta, la bubble de HAVI
debe aparecer automáticamente después de un delay, como si HAVI notara
que el usuario necesita ayuda.

```jsx
// En MobileApp.jsx, el equipo ya tiene esta lógica con petPaused.
// Extender para que el bubble auto-aparezca al entrar a 'salud' y 'estado':

useEffect(() => {
  if (screen === 'salud' || screen === 'estado') {
    // Esperar 1.5s para que el usuario vea la pantalla, luego mostrar bubble
    const t = setTimeout(() => setPetPaused(false), 1500)
    return () => clearTimeout(t)
  }
}, [screen])
```

---

## Checklist de salida de Fase 4

```
[ ] HaviBubble muestra mensaje diferente en cada pantalla
[ ] "quiero ver mis movimientos" en el chat → aparece botón "Ver movimientos →"
[ ] Al tocar el botón de navegación, la app va a la pantalla correcta
[ ] HAVI es accesible desde todas las pantallas (navbar o botón de esquina)
[ ] HaviBubble aparece automáticamente al entrar a Salud Financiera
[ ] HaviBubble aparece automáticamente al entrar a Estado de Cuenta
[ ] El botón HAVI de la navbar funciona desde todas las tabs
[ ] Demo funciona: usuario pregunta algo → HAVI responde con botón de navegación
```

---

## Script del demo para el pitch (actualización)

```
Usuario 1: USR-00207 (pago fallido)
→ Login → bubble aparece: "Tu pago de $876 en Superama no pasó"
→ Click bubble → chat → CTA "Activar alerta de saldo"
→ HAVI responde y ofrece botón "Ver mis movimientos →"
→ Click botón → app navega a estado de cuenta automáticamente
→ [MOSTRAR]: HAVI sabe dónde estás y te lleva ahí

Usuario 2: USR-00042 (inversión)
→ Login → mascota cambia (fox rojo - arquetipo Joven Profesional)
→ Entrar a Salud Financiera → bubble auto-aparece: "Tu crédito está al 55% 💳"
→ Click → chat → preguntar "¿cómo puedo mejorar mi score?"
→ HAVI responde con contexto de la pantalla de salud financiera
→ [MOSTRAR]: HAVI sabe en qué pantalla estás

Usuario 3: USR-00489 (suscripciones)
→ Login → preguntar en chat "quiero pagar mis servicios"
→ HAVI responde + botón "Ir a Pagos →"
→ [MOSTRAR]: HAVI infiere el intent y redirige
```
