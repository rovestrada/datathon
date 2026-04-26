# CONTEXT_PHASE_2_FRONTEND_CORE.md — Frontend Core (v2)
## Havi 360 · Hey Banco Hackathon

> Lee CONTEXT.md global antes de este archivo.
> Prerequisito: Fase 1 completada y funcionando.
> Esta fase tiene dos partes: integraciones al backend YA existente + preparación
> para Screen-Awareness (que se completa en Fase 3).

---

## Estado del frontend (del equipo)

El equipo ya construyó toda la UI. No hay que crear nada visual desde cero.
Tu trabajo es conectar lo visual al backend y preparar la infraestructura
para screen-awareness.

### Ya existe y NO tocar
- Login.jsx, MobileLogin.jsx — UI completa
- Dashboard.jsx — vista desktop
- ChatbotHAVI.jsx — UI del chat desktop
- MobileApp.jsx, MobileHome, MobileHAVI, etc. — toda la navegación mobile
- NavPet.jsx, HaviBubble.jsx, FloatingPet.jsx — mascota completa
- MobilePetCustomization.jsx — selector de mascota (ya funcional)

### Lo que falta (tu trabajo)

---

## F05 — vite.config.js con proxy (HACER PRIMERO)

Sin esto nada funciona. Reemplazar el vite.config.js completo:

```js
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

## F01 — AuthContext: login real + caché de user_id

Cambios respecto al AuthContext actual del equipo:
1. `login()` llama a `POST /api/auth/login` (real, no setTimeout)
2. `user_id` se cachea en `localStorage` (persiste entre sesiones)
3. `token` va en `sessionStorage` (se limpia al cerrar pestaña)
4. Se carga `chatOpenData` tras el login (trigger + pet_skin + opening_message)
5. Se expone `cachedUserId` para que Login muestre "Hola de nuevo, Ivan"

```jsx
// src/context/AuthContext.jsx — REEMPLAZAR COMPLETO
import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)
const LS_USER_KEY = 'havi_cached_user_id'   // localStorage — persiste
const SS_TOKEN_KEY = 'havi_token'            // sessionStorage — se limpia al cerrar

export function AuthProvider({ children }) {
  // user_id cacheado: solo para mostrar "Hola de nuevo" en el login
  const [cachedUserId]    = useState(() => localStorage.getItem(LS_USER_KEY))
  // user_id activo: se establece al hacer login exitoso
  const [customerId, setCustomerId] = useState(
    () => sessionStorage.getItem('havi_customer_id')
  )
  const [token, setToken] = useState(
    () => sessionStorage.getItem(SS_TOKEN_KEY)
  )
  const [chatOpenData, setChatOpenData] = useState(null)
  const [loginError,   setLoginError]   = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const login = useCallback(async (userId, password = 'demo') => {
    setLoginLoading(true)
    setLoginError(null)
    try {
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

      // Cachear user_id en localStorage para la próxima vez
      localStorage.setItem(LS_USER_KEY, user_id)
      sessionStorage.setItem('havi_customer_id', user_id)
      sessionStorage.setItem(SS_TOKEN_KEY, tok)
      setCustomerId(user_id)
      setToken(tok)

      // Cargar trigger activo
      const openRes = await fetch(`/api/chat/open?user_id=${user_id}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (openRes.ok) setChatOpenData(await openRes.json())

    } catch (err) {
      setLoginError(err.message)
      throw err
    } finally {
      setLoginLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.clear()
    // NO limpiar localStorage — queremos recordar el user_id para la próxima vez
    setCustomerId(null)
    setToken(null)
    setChatOpenData(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      customerId, token, chatOpenData, cachedUserId,
      loginError, loginLoading,
      isAuthenticated: Boolean(customerId && token),
      login, logout,
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

---

## F01b — Login.jsx: mostrar usuario cacheado

Dos cambios en Login.jsx:

```jsx
// 1. Leer cachedUserId y loginError del contexto
const { login, loginError, loginLoading, cachedUserId } = useAuth()

// 2. Pre-rellenar el input si hay usuario cacheado
const [value, setValue] = useState(() => cachedUserId ?? '')

// 3. Agregar saludo personalizado sobre el logo (si hay usuario cacheado):
{cachedUserId && (
  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', textAlign: 'center' }}>
    Hola de nuevo 👋
  </p>
)}

// 4. handleSubmit async (reemplazar el setTimeout):
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!value.trim()) return
  try { await login(value.trim()) }
  catch { /* loginError se muestra abajo */ }
}

// 5. Mostrar error (agregar después del botón submit):
{loginError && (
  <p style={{ color: '#f87171', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>
    {loginError}
  </p>
)}

// 6. Usar loginLoading en lugar del estado local loading:
disabled={loginLoading || !value.trim()}
```

Aplicar el mismo patrón en MobileLogin.jsx.

---

## F02 — PetContext: default por arquetipo + customización

```jsx
// src/context/PetContext.jsx — REEMPLAZAR COMPLETO
import { createContext, useContext, useState, useCallback } from 'react'

const PetContext = createContext(null)
const LS_PET_KEY = 'havi_pet_preference'   // localStorage: la elección del usuario

// Default de mascota por arquetipo (asignado por el pipeline ML)
const ARCHETYPE_PET_MAP = {
  'Joven Profesional Urbano': { petType: 'fox',   petVariant: 'red'   },
  'Estudiante Digital':       { petType: 'panda', petVariant: 'black' },
  'Ahorrador Precavido':      { petType: 'dog',   petVariant: 'white' },
  'Emprendedor Digital':      { petType: 'panda', petVariant: 'brown' },
  'Usuario Inactivo':         { petType: 'dog',   petVariant: 'brown' },
}
const DEFAULT_PET = { petType: 'fox', petVariant: 'red' }

export function PetProvider({ children }) {
  const [petEnabled, setPetEnabled] = useState(true)

  // Leer preferencia guardada del usuario, si existe
  const savedPref = (() => {
    try { return JSON.parse(localStorage.getItem(LS_PET_KEY)) } catch { return null }
  })()

  const [petType,    setPetType]    = useState(savedPref?.petType    ?? DEFAULT_PET.petType)
  const [petVariant, setPetVariant] = useState(savedPref?.petVariant ?? DEFAULT_PET.petVariant)

  // Llamado al hacer login: aplica el default del arquetipo SI el usuario
  // nunca ha customizado su mascota
  const applyArchetypeDefault = useCallback((archetypeName) => {
    if (localStorage.getItem(LS_PET_KEY)) return  // usuario ya eligió — respetar
    const mapped = ARCHETYPE_PET_MAP[archetypeName] ?? DEFAULT_PET
    setPetType(mapped.petType)
    setPetVariant(mapped.petVariant)
  }, [])

  // Llamado desde MobilePetCustomization — guarda la elección del usuario
  const setUserPet = useCallback((type, variant) => {
    setPetType(type)
    setPetVariant(variant)
    localStorage.setItem(LS_PET_KEY, JSON.stringify({ petType: type, petVariant: variant }))
  }, [])

  return (
    <PetContext.Provider value={{
      petEnabled, setPetEnabled,
      petType, petVariant,
      setUserPet,           // ← usar en MobilePetCustomization (reemplaza setPetType/setPetVariant)
      applyArchetypeDefault, // ← llamar en MobileApp cuando llega el perfil
    }}>
      {children}
    </PetContext.Provider>
  )
}

export function usePet() {
  const ctx = useContext(PetContext)
  if (!ctx) throw new Error('usePet must be used inside PetProvider')
  return ctx
}
```

**Conectar en MobileApp.jsx** — agregar después de los useState:
```jsx
const { chatOpenData } = useAuth()
const { applyArchetypeDefault } = usePet()

// Cuando llega el perfil tras el login, aplicar mascota default por arquetipo
useEffect(() => {
  if (chatOpenData?.archetype_name) {
    applyArchetypeDefault(chatOpenData.archetype_name)
  }
}, [chatOpenData])
```

**Nota:** `chatOpenData` no tiene `archetype_name` actualmente. Necesitas que
el endpoint `GET /chat/open` lo incluya, O cargar el perfil completo con
`GET /user/profile/:id` y leer `archetype_name` de ahí.

**Conectar en MobilePetCustomization.jsx** — reemplazar llamadas a setPetType/setPetVariant:
```jsx
const { setUserPet } = usePet()
// Al elegir una mascota:
setUserPet(selectedType, selectedVariant)  // en lugar de setPetType + setPetVariant
```

---

## F03 — ScreenContext: infraestructura para Phase 3

Este contexto es la base del Screen-Awareness. Se implementa aquí para que
Phase 3 pueda construir sobre él sin modificar otros componentes.

```jsx
// src/context/ScreenContext.jsx — CREAR NUEVO
import { createContext, useContext, useState, useCallback } from 'react'

const ScreenContext = createContext(null)

export function ScreenProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('inicio')
  // Cache de screen data: { [screenId]: data }
  const [screenCache, setScreenCache] = useState({})
  const [screenLoading, setScreenLoading] = useState(false)

  // Notificar el cambio de pantalla — llamar desde MobileApp.goTo()
  const navigateTo = useCallback((screen) => {
    setCurrentScreen(screen)
  }, [])

  // Guardar screen data en cache cuando llega de la API
  const cacheScreenData = useCallback((screenId, data) => {
    setScreenCache(prev => ({ ...prev, [screenId]: data }))
  }, [])

  return (
    <ScreenContext.Provider value={{
      currentScreen,
      screenCache,
      screenLoading,
      navigateTo,
      cacheScreenData,
      setScreenLoading,
    }}>
      {children}
    </ScreenContext.Provider>
  )
}

export function useScreen() {
  const ctx = useContext(ScreenContext)
  if (!ctx) throw new Error('useScreen must be used inside ScreenProvider')
  return ctx
}
```

**Montar en main.jsx** — envolver la app con ScreenProvider:
```jsx
// src/main.jsx
import { ScreenProvider } from './context/ScreenContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PetProvider>
      <ScreenProvider>
        <App />
      </ScreenProvider>
    </PetProvider>
  </StrictMode>
)
```

**Conectar MobileApp.jsx** — notificar cambios de pantalla:
```jsx
const { navigateTo } = useScreen()

const goTo = (s) => {
  setPrevScreen(screen)
  setScreen(s)
  navigateTo(s)   // ← agregar esta línea
}
```

---

## F04 — ChatbotHAVI y MobileHAVI: conectar al backend real

### ChatbotHAVI.jsx (desktop)

Cambios mínimos — no tocar la UI:

```jsx
// 1. Nuevas props: token, chatOpenData
const ChatbotHAVI = memo(function ChatbotHAVI({
  isOpen, onClose, customerId, token, chatOpenData
}) {

// 2. sessionId por instancia
const sessionId = useRef(crypto.randomUUID())
const [ctasDone, setCtasDone] = useState(false)

// 3. Mensaje inicial proactivo (reemplazar WELCOME_MESSAGE)
const [messages, setMessages] = useState(() => [{
  id: 'welcome', from: 'bot', ts: Date.now(),
  text: chatOpenData?.opening_message
    ?? `¡Hola, Usuario #${customerId}! Soy HAVI. ¿En qué puedo ayudarte?`,
}])

// 4. sendMessage con API real (reemplazar el setTimeout + BOT_RESPONSES)
const sendMessage = useCallback(async (textOverride) => {
  const text = (textOverride ?? input).trim()
  if (!text || isTyping) return
  setMessages(prev => [...prev, { id: msgCounter++, from: 'user', text, ts: Date.now() }])
  setInput('')
  setIsTyping(true)
  setCtasDone(true)
  try {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: customerId, session_id: sessionId.current, message: text, current_screen: 'dashboard' }),
    })
    const data = await res.json()
    setMessages(prev => [...prev, { id: msgCounter++, from: 'bot', ts: Date.now(),
      text: res.ok ? data.reply : 'Tuve un problema técnico. Intenta de nuevo.' }])
  } catch {
    setMessages(prev => [...prev, { id: msgCounter++, from: 'bot', ts: Date.now(),
      text: 'Sin conexión con el servidor.' }])
  } finally { setIsTyping(false) }
}, [input, isTyping, customerId, token])

// 5. CTAs bajo el primer mensaje (agregar en el área de mensajes):
{messages.map((msg, i) => (
  <React.Fragment key={msg.id}>
    <MessageBubble msg={msg} />
    {i === 0 && !ctasDone && chatOpenData?.ctas && (
      <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', paddingLeft:'42px' }}>
        {chatOpenData.ctas.map(cta => (
          <button key={cta} onClick={() => sendMessage(cta)} style={{
            padding:'6px 13px', borderRadius:'20px', fontSize:'12.5px', cursor:'pointer',
            border:'1.5px solid',
            background: cta === 'Ahora no' ? 'transparent' : 'rgba(167,139,250,0.12)',
            color: cta === 'Ahora no' ? '#6b7280' : '#a78bfa',
            borderColor: cta === 'Ahora no' ? '#333' : '#a78bfa55',
          }}>{cta}</button>
        ))}
      </div>
    )}
  </React.Fragment>
))}
```

**En App.jsx** — pasar las nuevas props:
```jsx
const { isAuthenticated, customerId, token, chatOpenData } = useAuth()

<ChatbotHAVI isOpen={chatOpen} onClose={() => setChatOpen(false)}
  customerId={customerId} token={token} chatOpenData={chatOpenData} />
```

### MobileHAVI.jsx

Mismo patrón que ChatbotHAVI. Adicional: al recibir `navigation_action` en la
respuesta, llamar `goTo(data.navigation_action.screen)` — esto se implementa
en detalle en Fase 4.

---

## Checklist de salida de Fase 2

```
[ ] F05: vite.config.js tiene proxy /api → :8000
[ ] F01: Login llama a POST /api/auth/login real (no setTimeout)
[ ] F01: user_id se cachea en localStorage, aparece pre-rellenado al volver
[ ] F01: Login muestra "Hola de nuevo" si hay usuario cacheado
[ ] F01: Login muestra error rojo si las credenciales son incorrectas
[ ] F02: PetContext aplica mascota por defecto según arquetipo al hacer login
[ ] F02: MobilePetCustomization guarda la elección en localStorage
[ ] F02: La elección manual del usuario tiene prioridad sobre el default de arquetipo
[ ] F03: ScreenContext existe y MobileApp llama navigateTo() en cada goTo()
[ ] F04: ChatbotHAVI muestra opening_message del trigger como primer mensaje
[ ] F04: Los CTAs del trigger aparecen como botones bajo el primer mensaje
[ ] F04: El chat envía mensajes reales a POST /api/chat/message
[ ] F04: MobileHAVI tiene el mismo comportamiento que ChatbotHAVI
[ ] Sin errores CORS ni 401 en la consola del browser
```
