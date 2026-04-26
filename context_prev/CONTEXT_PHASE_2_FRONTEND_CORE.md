# CONTEXT_PHASE_2_FRONTEND_CORE.md — Frontend Core
## Havi Proactivo · Hey Banco Hackathon

> Lee CONTEXT.md global antes de este archivo.
> **Este archivo fue reescrito después de analizar el FRONTEND_SNAPSHOT.md del equipo.**
> El frontend tiene mucho trabajo hecho — esta fase ya no es "construir desde cero"
> sino "conectar lo visual al backend real". No toques lo que ya funciona.

---

## Estado real del frontend (post-snapshot)

### Lo que YA existe y NO debes tocar

| Componente | Estado | Notas |
|-----------|--------|-------|
| `Login.jsx` (desktop) | ✅ Completo | UI pulida, animaciones, branding correcto |
| `MobileLogin.jsx` | ✅ Completo | Vista móvil del login |
| `Dashboard.jsx` | ✅ Completo | Vista desktop con sidebar, saldos, gauge |
| `ChatbotHAVI.jsx` | ✅ UI completa | Falta: conectar a API real en lugar de BOT_RESPONSES hardcodeadas |
| `MobileApp.jsx` | ✅ Completo | Navegación por estados, lógica de pet/nav/screens |
| `MobileHome.jsx` | ✅ Completo | Home móvil con tarjeta dinámica |
| `MobileHAVI.jsx` | ✅ UI completa | Falta: conectar a API real |
| `MobileFinancialHealth.jsx` | ✅ Completo | Pantalla de salud financiera |
| `MobileStatement.jsx` | ✅ Completo | Historial de transacciones |
| `MobilePetCustomization.jsx` | ✅ Completo | Selector de mascota (panda/dog/fox) |
| `NavPet.jsx` | ✅ Completo | Mascota animada sobre la navbar |
| `HaviBubble.jsx` | ✅ Completo | Burbuja de sugerencias contextuales |
| `FloatingPet.jsx` | ✅ Completo | Mascota desktop |
| `PetContext.jsx` | ✅ Completo | Estado global de la mascota (tipo, variante, enabled) |
| `AuthContext.jsx` | ⚠️ Parcial | Funciona, pero no llama a la API — ver F01 |

### Assets de pets disponibles
```
public/pets/
├── dog/   — black, brown, red, white  × (idle, run, walk)
├── fox/   — red, white                × (idle, run, walk)
└── panda/ — black, brown              × (idle, run, walk)
```

### Stack real del proyecto
- React 19 + Vite
- **Framer Motion** para animaciones (ya instalado, úsalo)
- **Tailwind CSS v4** (ya instalado, mezcla con inline styles)
- **lucide-react** para íconos
- **Sin React Router** — navegación por estado en MobileApp + condicional en App.jsx
- **Sin axios** — fetch nativo o instalar axios
- **Sin uuid** — usar `crypto.randomUUID()`

### Paleta de colores real del proyecto
El equipo usó una paleta diferente a la del CONTEXT.md original. Usa esta:
```
Fondo oscuro mobile:  #0a0a12 / #0d1022
Fondo desktop:        #f0f2f4
Acento principal:     #a78bfa  (violeta)
Acento secundario:    #22d3ee  (cyan)
Texto principal:      #111 (desktop) / #fff (mobile)
Texto muted:          #6b7280 / #9ca3af
Bordes:               #1a1a2a (mobile dark) / #e5e7eb (desktop)
```

---

## Lo que FALTA implementar (tu trabajo en esta fase)

Son exactamente **3 integraciones** y **1 archivo nuevo**. Nada más.

### F01 — Conectar AuthContext a la API real

**Archivo:** `src/context/AuthContext.jsx`

El AuthContext actual guarda solo el `customerId` en localStorage sin validar
contra el backend. Necesitas:

1. Llamar a `POST /api/auth/login` con `{user_id, password}`.
2. Guardar el `token` en `sessionStorage` (no localStorage — así se limpia al cerrar pestaña).
3. Exponer `token` y `chatOpenData` (el resultado de `GET /api/chat/open`) en el contexto.
4. `chatOpenData` es el objeto que contiene `opening_message`, `ctas`, `pet_skin` y `trigger_id`
   — lo necesitan HaviBubble, MobileHAVI y NavPet para saber qué skin mostrar.

```jsx
// src/context/AuthContext.jsx — REEMPLAZAR COMPLETO
import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [customerId, setCustomerId] = useState(
    () => sessionStorage.getItem('havi_customer_id')
  )
  const [token, setToken] = useState(
    () => sessionStorage.getItem('havi_token')
  )
  // Datos del trigger activo — se cargan al hacer login
  // Estructura: { trigger_id, opening_message, ctas, pet_skin } | null
  const [chatOpenData, setChatOpenData] = useState(null)
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const login = useCallback(async (userId, password = 'demo') => {
    setLoginLoading(true)
    setLoginError(null)
    try {
      // 1. Autenticar
      const authRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, password }),
      })
      if (!authRes.ok) {
        const err = await authRes.json()
        throw new Error(err.detail || 'Credenciales inválidas')
      }
      const { token: tok, user_id } = await authRes.json()

      // 2. Guardar sesión
      sessionStorage.setItem('havi_token', tok)
      sessionStorage.setItem('havi_customer_id', user_id)
      setToken(tok)
      setCustomerId(user_id)

      // 3. Cargar trigger activo (pet_skin + opening_message)
      const openRes = await fetch(`/api/chat/open?user_id=${user_id}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (openRes.ok) {
        const openData = await openRes.json()
        setChatOpenData(openData)
      }
    } catch (err) {
      setLoginError(err.message)
      throw err   // re-throw para que Login.jsx pueda mostrar el error
    } finally {
      setLoginLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.clear()
    setCustomerId(null)
    setToken(null)
    setChatOpenData(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      customerId,
      token,
      chatOpenData,      // ← NUEVO: trigger activo con pet_skin y opening_message
      loginError,
      loginLoading,
      isAuthenticated: Boolean(customerId && token),
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

**Cambios necesarios en `Login.jsx` y `MobileLogin.jsx`:**

El `login()` ahora es async y puede lanzar. Actualiza el handler del form:

```jsx
// En Login.jsx — reemplazar handleSubmit
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!value.trim()) return
  try {
    await login(value.trim())
    // Si no lanza, el login fue exitoso — AuthContext actualiza isAuthenticated
  } catch {
    // loginError ya está en el contexto, Login.jsx lo puede leer
  }
}

// Mostrar error en el JSX (agregar bajo el botón submit):
// {loginError && <p style={{color:'#f87171', fontSize:'13px', marginTop:'8px'}}>{loginError}</p>}
```

---

### F02 — Conectar ChatbotHAVI al backend real

**Archivo:** `src/components/ChatbotHAVI.jsx`

El chat desktop ya tiene toda la UI. Solo hay que reemplazar la lógica de
`sendMessage` que usa `BOT_RESPONSES` hardcodeadas por una llamada real a
`POST /api/chat/message`.

Cambios mínimos — no toques la UI:

```jsx
// 1. Eliminar estas constantes al inicio del archivo:
// const BOT_RESPONSES = [...]

// 2. Agregar sessionId (una sola vez por instancia del chat)
// Dentro del componente ChatbotHAVI, junto a los otros useState:
const sessionId = useRef(crypto.randomUUID())

// 3. Reemplazar la función sendMessage:
const sendMessage = useCallback(async () => {
  const text = input.trim()
  if (!text || isTyping) return

  const userMsg = { id: msgCounter++, from: 'user', text, ts: Date.now() }
  setMessages(prev => [...prev, userMsg])
  setInput('')
  setIsTyping(true)

  try {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,   // token viene de prop o contexto
      },
      body: JSON.stringify({
        user_id: customerId,
        session_id: sessionId.current,
        message: text,
      }),
    })
    const data = await res.json()
    setMessages(prev => [...prev, {
      id: msgCounter++, from: 'bot',
      text: res.ok ? data.reply : 'Tuve un problema técnico. Intenta de nuevo.',
      ts: Date.now()
    }])
  } catch {
    setMessages(prev => [...prev, {
      id: msgCounter++, from: 'bot',
      text: 'Sin conexión. Verifica que el servidor esté corriendo.',
      ts: Date.now()
    }])
  } finally {
    setIsTyping(false)
  }
}, [input, isTyping, customerId, token])
```

**Pasar `token` al componente:**

En `App.jsx`, `ChatbotHAVI` recibe `customerId`. Agrega también `token`:

```jsx
// En AppContent() dentro de App.jsx:
const { isAuthenticated, customerId, token, chatOpenData } = useAuth()

// Pasar token al componente:
<ChatbotHAVI isOpen={chatOpen} onClose={() => setChatOpen(false)}
  customerId={customerId} token={token} />
```

**Mensaje de bienvenida proactivo:**

Reemplaza `WELCOME_MESSAGE` para usar el `opening_message` del trigger si existe:

```jsx
// Cambiar la inicialización de messages en ChatbotHAVI:
// Recibe chatOpenData como prop adicional desde App.jsx
const [messages, setMessages] = useState(() => [{
  id: 'welcome', from: 'bot', ts: Date.now(),
  text: chatOpenData?.opening_message
    ?? `¡Hola, Usuario #${customerId}! Soy HAVI, tu asistente financiero. ¿En qué puedo ayudarte?`,
}])
```

---

### F03 — Conectar MobileHAVI al backend real

**Archivo:** `src/components/mobile/MobileHAVI.jsx`

Mismo patrón que F02 pero para la vista móvil. El componente ya existe con su UI.
Necesita:

1. Leer `token` y `chatOpenData` del AuthContext.
2. Reemplazar la lógica de respuestas hardcodeadas por `POST /api/chat/message`.
3. Mostrar el `opening_message` del trigger como primer mensaje.
4. Agregar botones de CTA (`chatOpenData.ctas`) bajo el primer mensaje.

```jsx
// Al inicio de MobileHAVI, agregar:
import { useAuth } from '../../context/AuthContext'

// Dentro del componente:
const { token, chatOpenData } = useAuth()
const sessionId = useRef(crypto.randomUUID())

// Mensaje inicial proactivo:
const [messages, setMessages] = useState(() => [{
  id: 'welcome', from: 'bot', ts: Date.now(),
  text: chatOpenData?.opening_message ?? `Hola 👋 ¿En qué te ayudo hoy?`,
}])

// Estado para ocultar CTAs después del primer mensaje del usuario:
const [ctasDone, setCtasDone] = useState(false)
```

**CTAs como botones bajo el primer mensaje:**

Busca donde se renderizan los mensajes en `MobileHAVI.jsx` y agrega los botones
justo después del mensaje de bienvenida, antes de que `ctasDone` sea true:

```jsx
{/* Después del primer mensaje, antes del resto del historial */}
{!ctasDone && chatOpenData?.ctas && (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: '40px', marginTop: '-4px' }}>
    {chatOpenData.ctas.map(cta => (
      <button
        key={cta}
        onClick={() => { setCtasDone(true); sendMessage(cta) }}
        style={{
          padding: '7px 14px', borderRadius: '20px', fontSize: '13px',
          cursor: 'pointer', border: '1.5px solid',
          background: cta === 'Ahora no' ? 'transparent' : 'rgba(167,139,250,0.15)',
          color: cta === 'Ahora no' ? '#6b7280' : '#a78bfa',
          borderColor: cta === 'Ahora no' ? '#374151' : '#a78bfa66',
        }}
      >
        {cta}
      </button>
    ))}
  </div>
)}
```

---

### F04 — Conectar pet_skin a NavPet

**Archivo:** `src/components/mobile/NavPet.jsx`

El NavPet ya recibe `petType` y `petVariant` del PetContext (que el usuario puede
cambiar en MobileSettings → Mascota). Ahora también debe reaccionar al `pet_skin`
del trigger activo — este es el cambio que hace el "wow moment" del demo:
**cuando cambias de usuario, la mascota cambia de color automáticamente**.

La lógica de mapeo es:

```jsx
// Tabla de mapeo pet_skin → { petType, petVariant }
const PET_SKIN_MAP = {
  cat_orange: { petType: 'fox',   petVariant: 'red'   },
  cat_purple: { petType: 'dog',   petVariant: 'black' },
  cat_green:  { petType: 'panda', petVariant: 'brown' },
  cat_gray:   { petType: 'dog',   petVariant: 'white' },
}
```

> Nota: el equipo usó dog/fox/panda en lugar de cat_* — el mapeo traduce
> el `pet_skin` del backend a los assets reales que ya existen en `public/pets/`.

**Dónde aplicar el mapeo:**

En `MobileApp.jsx`, después de hacer login y tener `chatOpenData`:

```jsx
// En MobileApp.jsx, agregar al inicio:
import { useAuth } from '../../context/AuthContext'
const { chatOpenData } = useAuth()

// Importar el PetContext para poder sobreescribir el skin:
const { petType, petVariant, setPetFromSkin } = usePet()

// En PetContext.jsx, agregar una función setPetFromSkin:
// (ver F04b abajo)

// Efecto que sincroniza el skin del trigger con la mascota:
useEffect(() => {
  if (chatOpenData?.pet_skin) {
    setPetFromSkin(chatOpenData.pet_skin)
  }
}, [chatOpenData])
```

**F04b — Agregar `setPetFromSkin` a PetContext:**

```jsx
// En PetContext.jsx, dentro del Provider, agregar:
const PET_SKIN_MAP = {
  cat_orange: { petType: 'fox',   petVariant: 'red'   },
  cat_purple: { petType: 'dog',   petVariant: 'black' },
  cat_green:  { petType: 'panda', petVariant: 'brown' },
  cat_gray:   { petType: 'dog',   petVariant: 'white' },
}

const setPetFromSkin = useCallback((skin) => {
  const mapped = PET_SKIN_MAP[skin]
  if (mapped) {
    setPetType(mapped.petType)
    setPetVariant(mapped.petVariant)
  }
}, [])

// Agregar setPetFromSkin al value del Provider:
// value={{ ..., setPetFromSkin }}
```

---

### F05 — vite.config.js: agregar proxy al backend

El proyecto actual no tiene proxy configurado. Sin esto, las llamadas a `/api/...`
darán error CORS en desarrollo.

```js
// vite.config.js — REEMPLAZAR COMPLETO
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

---

## Orden de implementación recomendado

```
F05 (proxy)  →  F01 (AuthContext)  →  F02 (ChatbotHAVI desktop)
                                   →  F03 (MobileHAVI)
                                   →  F04 (pet_skin mapping)
```

F05 primero porque sin proxy nada funciona. F01 segundo porque F02, F03 y F04
dependen de que `token` y `chatOpenData` estén en el contexto.

---

## Smoke test manual para verificar la integración

Con el backend corriendo en `:8000` y el frontend en `:5173`:

```
1. Abre http://localhost:5173
2. En desktop: escribe "USR-00042" en el login → click Continuar
   - Debe redirigir al Dashboard (como antes)
   - Consola del browser: no debe haber errores 401 ni CORS
3. En móvil (o devtools < 768px): escribe "USR-00207"
   - Al abrir el chat de HAVI, el primer mensaje debe ser el opening_message
     de T01 (pago fallido), no el genérico "¿En qué te ayudo?"
   - Los 3 CTAs deben aparecer como botones bajo el primer mensaje
   - La mascota debe ser un perro negro (cat_purple → dog/black)
4. Cambiar a "USR-00489":
   - La mascota debe cambiar a panda marrón (cat_green → panda/brown)
   - El opening_message debe hablar de suscripciones
5. Enviar un mensaje libre en el chat: Havi debe responder con contexto real
   (no las frases hardcodeadas de BOT_RESPONSES)
```

---

## Lo que NO tocar en esta fase

- No refactorizar la navegación — el sistema de estados de MobileApp funciona.
- No cambiar la paleta de colores — el equipo eligió violeta/cyan, no naranja.
- No agregar React Router — la navegación por estados es intencional.
- No cambiar localStorage a sessionStorage en lugares que no sean AuthContext.
- No modificar FloatingPet, Dashboard, ni los componentes de pantallas secundarias.
- No instalar axios si ya tienes fetch nativo funcionando.
