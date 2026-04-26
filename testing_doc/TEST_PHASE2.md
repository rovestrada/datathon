# TEST_PHASE2.md — Testing de la Fase 2: Frontend Core
## Havi 360 · Hey Banco Hackathon

> Prerequisitos antes de empezar:
> - Backend corriendo: `uvicorn api.main:app --reload --port 8000`
> - Frontend corriendo: `npm run dev` (localhost:5173)
> - Fase 1 pasando todos sus tests (TEST_PHASE1.md)
> - DevTools del browser abiertos en la pestaña **Console** y **Network**

---

## Mapa de tests por feature

| Feature | Tests | Herramienta |
|---------|-------|-------------|
| F05 — Proxy Vite | T01–T02 | Browser DevTools |
| F01 — Login real + caché | T03–T09 | Browser manual |
| F02 — PetContext por arquetipo | T10–T14 | Browser manual |
| F03 — ScreenContext | T15–T17 | Browser DevTools / Console |
| F04 — Chat conectado al backend | T18–T24 | Browser manual |
| Regresión general | T25–T27 | Browser manual |

---

## Setup previo: limpiar estado del browser

Antes de correr cualquier test, ejecuta esto en la consola del browser
para asegurarte de partir de un estado limpio:

```js
localStorage.clear()
sessionStorage.clear()
console.log('Storage limpiado ✓')
console.log('localStorage:', Object.keys(localStorage))
console.log('sessionStorage:', Object.keys(sessionStorage))
```

---

## F05 — Proxy Vite

### T01 — El proxy redirige correctamente al backend

Con el frontend corriendo en `:5173`, ejecuta en la consola del browser:

```js
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('✓ Proxy OK:', d))
  .catch(e => console.error('✗ Proxy FAIL:', e))
```

**Resultado esperado:**
```
✓ Proxy OK: {status: 'ok'}
```

**Si falla:** el `vite.config.js` no tiene el proxy configurado, o el backend
no está corriendo en `:8000`. Verifica ambos antes de continuar.

---

### T02 — No hay errores CORS en ninguna llamada

1. Abre DevTools → Network
2. Filtra por `Fetch/XHR`
3. Navega por la app (login, home, abrir el chat)
4. Busca cualquier respuesta con status `0` o headers que mencionen `CORS`

**Resultado esperado:** ninguna petición a `/api/*` muestra error CORS.

**Si aparece CORS:** el frontend está llamando a `http://localhost:8000` directamente
en lugar de usar `/api/`. Busca en el código cualquier URL hardcodeada y reemplázala
por `/api/...`.

---

## F01 — Login real + caché de user_id

### T03 — Login con credenciales correctas llama al backend real

1. Abre DevTools → Network
2. Ve a la pantalla de login
3. Escribe `USR-00042` y una contraseña (demo o cualquiera)
4. Click en "Continuar"

**En Network, verifica que aparecen exactamente estas dos llamadas en orden:**

```
POST /api/auth/login      → 200
GET  /api/chat/open       → 200
```

**Si solo aparece una llamada o ninguna:** el `AuthContext` todavía está usando
`setTimeout` en lugar de `fetch`. El `login()` no es async todavía.

**Si aparece un error de red (Failed to fetch):** el backend no está corriendo
o el proxy no está configurado (ver T01).

---

### T04 — Login exitoso guarda correctamente en storage

Tras hacer login con `USR-00042/demo`, ejecuta en consola:

```js
const checks = {
  'localStorage havi_cached_user_id': localStorage.getItem('havi_cached_user_id'),
  'sessionStorage havi_token':        sessionStorage.getItem('havi_token'),
  'sessionStorage havi_customer_id':  sessionStorage.getItem('havi_customer_id'),
}
console.table(checks)

// Validaciones
console.assert(localStorage.getItem('havi_cached_user_id') === 'USR-00042', '✗ cached_user_id incorrecto')
console.assert(sessionStorage.getItem('havi_token') !== null,               '✗ token no guardado')
console.assert(sessionStorage.getItem('havi_customer_id') === 'USR-00042',  '✗ customer_id incorrecto')
console.log('✓ Storage validado')
```

**Resultado esperado:**

| Key | Value |
|-----|-------|
| `localStorage.havi_cached_user_id` | `USR-00042` |
| `sessionStorage.havi_token` | `VVNSLTAwMDQy` (base64) |
| `sessionStorage.havi_customer_id` | `USR-00042` |

**Regla crítica:** `havi_cached_user_id` va en `localStorage` (persiste).
El token va en `sessionStorage` (se limpia al cerrar la pestaña).
Si están en el storage equivocado, el caché de usuario no funcionará.

---

### T05 — El user_id se pre-rellena en el próximo login

1. Haz login con `USR-00042` (T03/T04 deben pasar primero)
2. Haz logout
3. Observa la pantalla de login

**Resultado esperado:**
- El input del usuario ya tiene `USR-00042` pre-rellenado
- Aparece el texto "Hola de nuevo 👋" (o similar) sobre el formulario
- El usuario solo necesita escribir su contraseña

**Si el campo está vacío:** `Login.jsx` no lee `cachedUserId` del `AuthContext`,
o el `useState` del input no se inicializa con `cachedUserId`.

---

### T06 — Logout no borra el user_id cacheado

1. Haz login con `USR-00042`
2. Haz logout
3. Ejecuta en consola:

```js
console.log('cached_user_id después del logout:', localStorage.getItem('havi_cached_user_id'))
console.log('token después del logout:', sessionStorage.getItem('havi_token'))
console.log('customer_id después del logout:', sessionStorage.getItem('havi_customer_id'))

console.assert(localStorage.getItem('havi_cached_user_id') === 'USR-00042', '✗ cached_user_id se borró — no debería')
console.assert(sessionStorage.getItem('havi_token') === null, '✗ token no se limpió')
console.assert(sessionStorage.getItem('havi_customer_id') === null, '✗ customer_id no se limpió')
```

**Resultado esperado:**
- `localStorage.havi_cached_user_id` = `USR-00042` ← se mantiene
- `sessionStorage.havi_token` = `null` ← se limpió
- `sessionStorage.havi_customer_id` = `null` ← se limpió

**Si el `cached_user_id` se borró:** `logout()` está llamando `localStorage.clear()`
en lugar de solo `sessionStorage.clear()`.

---

### T07 — Error de credenciales muestra mensaje en pantalla

1. Ve al login
2. Escribe un user_id que no existe: `USR-99999`
3. Contraseña: cualquier cosa
4. Click en "Continuar"

**Resultado esperado:**
- Aparece un mensaje de error en rojo en la pantalla: *"Credenciales inválidas"* (o similar)
- El formulario NO desaparece — el usuario se queda en el login
- En Network: `POST /api/auth/login` devuelve `401`

**Si la app navega de todas formas o no muestra error:** `handleSubmit` no tiene
`try/catch`, o `loginError` no está siendo leído del contexto en el JSX.

---

### T08 — chatOpenData se carga tras el login

Tras hacer login exitoso, ejecuta en consola:

```js
// Verificar que React tiene chatOpenData en el contexto
// Busca el componente App o AuthProvider en React DevTools,
// o usa este snippet para verificar que los datos llegaron:

// El opening_message debe estar disponible — lo puedes ver en el chat
// Verificación alternativa via Network:
// En la pestaña Network, el GET /api/chat/open debe devolver:
// { trigger_id, opening_message, ctas, pet_skin }
```

Verificación visual: después del login, abre el chat de HAVI. El **primer mensaje**
debe ser el `opening_message` del trigger activo del usuario, no el genérico
*"¡Hola! Soy HAVI..."*.

| user_id | Primer mensaje esperado (inicio) |
|---------|----------------------------------|
| USR-00042 | Menciona inversión / $12,400 |
| USR-00101 | Menciona cashback / Hey Pro |
| USR-00207 | Menciona pago fallido / Superama |
| USR-00315 | Menciona días sin actividad |
| USR-00489 | Menciona suscripciones / $1,837 |

---

### T09 — Cambiar de usuario actualiza chatOpenData

1. Login con `USR-00207` → anota el primer mensaje del chat
2. Logout
3. Login con `USR-00042` → abre el chat

**Resultado esperado:** el primer mensaje del chat es completamente distinto al del paso 1.
Los dos usuarios tienen triggers distintos (T01 vs T06).

**Si el mensaje es el mismo:** `chatOpenData` no se resetea al hacer logout,
o el `useState` está cacheando el valor anterior.

---

## F02 — PetContext: default por arquetipo

### T10 — Sin preferencia guardada, el arquetipo define la mascota

1. Asegúrate de que no hay preferencia guardada:
```js
localStorage.removeItem('havi_pet_preference')
console.log('pet_preference limpiado:', localStorage.getItem('havi_pet_preference'))
```

2. Haz login con `USR-00042` (arquetipo: Joven Profesional Urbano → fox/red)
3. Navega a la pantalla principal donde aparece la mascota

**Resultado esperado:** la mascota que aparece es un **zorro rojo** (fox/red).

Tabla de arquetipos → mascota esperada:

| user_id | Arquetipo | Pet esperado |
|---------|-----------|-------------|
| USR-00042 | Joven Profesional Urbano | fox / red |
| USR-00101 | Estudiante Digital | panda / black |
| USR-00207 | Ahorrador Precavido | dog / white |
| USR-00315 | Usuario Inactivo | dog / brown |
| USR-00489 | Emprendedor Digital | panda / brown |

**Si la mascota no cambia entre usuarios:** `applyArchetypeDefault` no se está
llamando en `MobileApp` al recibir el `chatOpenData`, o el `archetype_name`
no está llegando en la respuesta de la API.

> **Nota:** para que `applyArchetypeDefault` funcione, el backend necesita
> incluir `archetype_name` en `GET /chat/open` O el frontend debe hacer una
> llamada adicional a `GET /user/profile/:id` después del login. Verifica cuál
> de los dos enfoques implementó tu equipo.

---

### T11 — La elección manual del usuario tiene prioridad sobre el arquetipo

1. Limpia la preferencia: `localStorage.removeItem('havi_pet_preference')`
2. Login con `USR-00042` (fox/red por defecto)
3. Ve a Ajustes → Mascota
4. Cambia la mascota a `panda/brown`
5. Sal de la pantalla de mascota y vuelve al inicio

**Resultado esperado:** la mascota es ahora **panda marrón**, no el fox rojo del arquetipo.

---

### T12 — La preferencia persiste entre sesiones

Continuando desde T11 (mascota cambiada a panda/brown):

1. Verifica en consola que se guardó:
```js
console.log('pet_preference guardado:', localStorage.getItem('havi_pet_preference'))
// Esperado: {"petType":"panda","petVariant":"brown"}
```

2. Haz logout
3. Haz login nuevamente con el mismo usuario
4. Observa la mascota al cargar la pantalla principal

**Resultado esperado:**
- `localStorage.havi_pet_preference` contiene el JSON con la elección
- La mascota sigue siendo **panda marrón** — la elección se respetó
- El arquetipo (fox/red) **no** sobreescribió la elección del usuario

**Si el arquetipo sobreescribe la preferencia:** `applyArchetypeDefault` no está
verificando si existe `havi_pet_preference` en localStorage antes de aplicar
el default. La condición de guarda debe ser:
```js
if (localStorage.getItem(LS_PET_KEY)) return  // respetar elección del usuario
```

---

### T13 — Limpiar preferencia restablece el default de arquetipo

1. Desde T12, ejecuta:
```js
localStorage.removeItem('havi_pet_preference')
```
2. Haz logout y login de nuevo con `USR-00042`

**Resultado esperado:** la mascota vuelve a ser **fox rojo** (default del arquetipo).

---

### T14 — `setUserPet` actualiza storage y el contexto simultáneamente

En la pantalla de personalización de mascota, elige cualquier combinación.
Verifica en consola inmediatamente después de elegir:

```js
const stored = JSON.parse(localStorage.getItem('havi_pet_preference') || 'null')
console.log('Guardado en localStorage:', stored)
// El valor debe coincidir con la mascota que se ve en pantalla en ese momento
```

**Resultado esperado:** el valor en `localStorage` coincide con la mascota
visible sin necesidad de recargar la página.

---

## F03 — ScreenContext

### T15 — ScreenContext está montado y accesible

En la consola del browser, mientras estás en la app (post-login):

```js
// Verifica que no hay error de "useScreen must be used inside ScreenProvider"
// Si ese error aparece en consola, ScreenProvider no está en main.jsx

// Verificación alternativa: abrir React DevTools (extensión del browser)
// y buscar "ScreenProvider" en el árbol de componentes
```

Si usas React DevTools, el árbol debe verse así:
```
PetProvider
  ScreenProvider       ← debe existir
    AuthProvider
      App
```

**Si el error aparece:** `ScreenProvider` no está importado o montado en `main.jsx`.

---

### T16 — navigateTo se llama en cada cambio de pantalla

1. Abre DevTools → Console
2. Agrega temporalmente un `console.log` en `MobileApp.jsx` para verificar:
```js
// Dentro del goTo() de MobileApp (temporal, solo para test):
const goTo = (s) => {
  console.log('[TEST T16] navigateTo llamado con:', s)
  setPrevScreen(screen)
  setScreen(s)
  navigateTo(s)
}
```
3. Navega entre pantallas: inicio → pagos → transferir → inicio

**Resultado esperado en consola:**
```
[TEST T16] navigateTo llamado con: pagos
[TEST T16] navigateTo llamado con: transferir
[TEST T16] navigateTo llamado con: inicio
```

**Quita el console.log después de verificar.**

---

### T17 — screenCache inicialmente vacío, listo para Fase 3

En consola, tras el login:

```js
// Acceder al estado de ScreenContext via React DevTools
// o verificar que no hay errores al importar useScreen en un componente

// Smoke test: el contexto existe y tiene la forma correcta
// (verificar en React DevTools que ScreenProvider tiene state:
//  currentScreen: "inicio", screenCache: {}, screenLoading: false)
```

Este test es de infraestructura — solo confirma que el contexto existe y
no tiene errores. La funcionalidad real de carga de screen_data se testa en Fase 3.

---

## F04 — Chat conectado al backend real

### T18 — El primer mensaje del chat es el opening_message del trigger

1. Login con `USR-00207` (trigger T01: pago fallido)
2. En mobile: navega a la pantalla HAVI
   En desktop: abre el chat con el botón flotante
3. Observa el primer mensaje

**Resultado esperado:**
- El primer mensaje de HAVI menciona el pago fallido de Superama
- **No** aparece *"¡Hola! Soy HAVI, tu asistente financiero. ¿En qué puedo ayudarte hoy?"*
- En Network: NO aparece ningún `POST /api/chat/message` al abrir el chat —
  el primer mensaje viene de `chatOpenData` que ya se cargó en el login,
  sin hacer una llamada adicional

---

### T19 — Los CTAs del trigger aparecen como botones

Continuando desde T18 (chat abierto con USR-00207, trigger T01):

**Resultado esperado bajo el primer mensaje:**
- Aparecen 3 botones: *"Activar alerta de saldo"*, *"Ver mi saldo ahora"*, *"Ahora no"*
- Los dos primeros tienen estilo de acción (color violeta / fondo semitransparente)
- *"Ahora no"* tiene estilo secundario (gris / borde suave)

**Si los botones no aparecen:** `chatOpenData` no se está pasando como prop
a `ChatbotHAVI`/`MobileHAVI`, o el JSX que los renderiza no está en el componente.

---

### T20 — Tocar un CTA envía ese texto como mensaje

Continuando desde T19:

1. Toca el botón *"Activar alerta de saldo"*

**Resultado esperado:**
- El texto *"Activar alerta de saldo"* aparece como mensaje del usuario en el chat
- Los 3 botones de CTA **desaparecen** (no vuelven a aparecer)
- Aparece el indicador de typing (los tres puntos animados)
- HAVI responde con un mensaje coherente sobre alertas de saldo
- En Network: aparece exactamente 1 `POST /api/chat/message` con body:
```json
{
  "user_id": "USR-00207",
  "session_id": "<uuid>",
  "message": "Activar alerta de saldo",
  "current_screen": "havi"
}
```

---

### T21 — La conversación libre funciona

Continuando desde T20:

1. Escribe manualmente: *"¿Cuánto tendría que tener en mi cuenta para evitar rechazos?"*
2. Presiona Enter o el botón de enviar

**Resultado esperado:**
- El mensaje aparece en el chat
- HAVI responde (máx ~5 segundos) con una respuesta coherente al contexto del usuario
- La respuesta menciona algo relacionado con saldo, alertas o el perfil de USR-00207
- **No** aparece texto en formato markdown (`**negritas**`, `- listas`, `# headers`)
- En Network: otro `POST /api/chat/message` con el nuevo mensaje

---

### T22 — El historial de sesión se mantiene entre mensajes

Continuando desde T21:

1. Envía un segundo mensaje de seguimiento: *"¿Y si necesito más, puedo pedir un adelanto?"*

**Resultado esperado:**
- HAVI responde con coherencia con los mensajes anteriores de la sesión
- No repite el saludo ni actúa como si fuera una conversación nueva
- El `session_id` en Network es el **mismo UUID** en todos los mensajes de esta sesión

Verifica en DevTools → Network que todos los `POST /api/chat/message` de esta
sesión tienen el mismo `session_id` en el body del request.

---

### T23 — Cambiar de usuario reinicia el chat con nuevo opening_message

1. Logout (estás en USR-00207, trigger T01 pago fallido)
2. Login con `USR-00489` (trigger T02 suscripciones dormidas)
3. Abre el chat

**Resultado esperado:**
- El primer mensaje es completamente distinto al de USR-00207
- Menciona suscripciones / $1,837 / número de apps
- Los CTAs son los del trigger T02: *"Ver mis suscripciones"*, etc.
- El historial del chat anterior **no aparece** — es una sesión nueva

Si el historial del usuario anterior persiste, el `sessionId` del componente
no se reinicia entre logins. Debe generarse con `crypto.randomUUID()` al
montar el componente, no persistirse en estado entre renders.

---

### T24 — El chat maneja errores de red graciosamente

1. Para el backend (`Ctrl+C` en la terminal del servidor)
2. Intenta enviar un mensaje en el chat
3. Espera la respuesta

**Resultado esperado:**
- Aparece el indicador de typing brevemente
- Aparece un mensaje de HAVI en rojo o muted: *"Sin conexión con el servidor."*
  o *"Tuve un problema técnico. Intenta de nuevo."*
- La app **no se rompe** — el usuario puede seguir usando la interfaz
- En Network: el `POST /api/chat/message` falla con error de red (sin status)

Reactiva el backend después de este test: `uvicorn api.main:app --reload --port 8000`

---

## Tests de regresión general

### T25 — El flujo desktop sigue funcionando

1. En una ventana de browser en modo desktop (> 768px)
2. Login con cualquier usuario demo
3. Verifica que el Dashboard se carga
4. Abre el ChatbotHAVI con el botón flotante
5. Envía un mensaje

**Resultado esperado:** todo funciona exactamente igual que en mobile, adaptado
al layout de escritorio. El `ChatToggleButton` sigue visible.

---

### T26 — La navegación entre pantallas no tiene regresiones

En mobile, navega por todas las tabs:
- Inicio → Pagos → Transferir → Buzón → volver a Inicio
- Inicio → Abrir HAVI → volver atrás
- Inicio → Ajustes → Mascota → elegir mascota → volver

**Resultado esperado:** en ningún paso aparece un error de consola del tipo:
- `useAuth must be used inside AuthProvider`
- `usePet must be used inside PetProvider`
- `useScreen must be used inside ScreenProvider`
- `Cannot read properties of null`

---

### T27 — Recarga de página mantiene la sesión activa

1. Haz login con `USR-00042`
2. Recarga la página (`F5` o `Cmd+R`)

**Resultado esperado:**
- La app **no** vuelve al login — el usuario sigue autenticado
- El `customerId` y `token` se restauran desde `sessionStorage`
- **En una pestaña nueva** (nuevo contexto): la app sí vuelve al login
  porque `sessionStorage` no comparte entre pestañas

Si la sesión se pierde al recargar: `AuthContext` no está inicializando
`customerId` y `token` desde `sessionStorage` en los `useState` iniciales.

---

## Script de verificación rápida pre-commit

Copia y pega este bloque completo en la consola del browser **después de hacer
login con USR-00042** para verificar los puntos más críticos de golpe:

```js
(async () => {
  const results = []
  const ok  = (name) => results.push({ status: '✓', name })
  const fail = (name, reason) => results.push({ status: '✗', name, reason })

  // Storage
  localStorage.getItem('havi_cached_user_id') === 'USR-00042'
    ? ok('localStorage.havi_cached_user_id = USR-00042')
    : fail('localStorage.havi_cached_user_id', `got: ${localStorage.getItem('havi_cached_user_id')}`)

  sessionStorage.getItem('havi_token') !== null
    ? ok('sessionStorage.havi_token existe')
    : fail('sessionStorage.havi_token', 'es null — el token no se guardó')

  sessionStorage.getItem('havi_customer_id') === 'USR-00042'
    ? ok('sessionStorage.havi_customer_id = USR-00042')
    : fail('sessionStorage.havi_customer_id', `got: ${sessionStorage.getItem('havi_customer_id')}`)

  // Proxy
  try {
    const r = await fetch('/api/health')
    const d = await r.json()
    d.status === 'ok'
      ? ok('Proxy /api → backend OK')
      : fail('Proxy', `respuesta inesperada: ${JSON.stringify(d)}`)
  } catch (e) {
    fail('Proxy /api → backend', `fetch error: ${e.message}`)
  }

  // Login API
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'USR-00042', password: 'demo' }),
    })
    r.status === 200
      ? ok('POST /api/auth/login → 200')
      : fail('POST /api/auth/login', `status: ${r.status}`)
  } catch(e) {
    fail('POST /api/auth/login', e.message)
  }

  // Chat open
  const tok = sessionStorage.getItem('havi_token')
  if (tok) {
    try {
      const r = await fetch('/api/chat/open?user_id=USR-00042', {
        headers: { Authorization: `Bearer ${tok}` }
      })
      const d = await r.json()
      d.trigger_id && d.opening_message && d.ctas?.length === 3
        ? ok('GET /api/chat/open → trigger + opening_message + 3 ctas')
        : fail('GET /api/chat/open', `datos incompletos: ${JSON.stringify(d)}`)
      d.ctas?.at(-1) === 'Ahora no'
        ? ok('Último CTA es "Ahora no"')
        : fail('Último CTA', `got: "${d.ctas?.at(-1)}"`)
      !('pet_skin' in d)
        ? ok('pet_skin eliminado del trigger (v2)')
        : fail('pet_skin en trigger', 'pet_skin NO debe estar en el trigger en v2')
    } catch(e) {
      fail('GET /api/chat/open', e.message)
    }
  } else {
    fail('GET /api/chat/open', 'sin token — haz login primero')
  }

  // Pet preference
  const petPref = localStorage.getItem('havi_pet_preference')
  petPref === null
    ? ok('havi_pet_preference vacío (aún no customizado — correcto para test de arquetipo)')
    : ok(`havi_pet_preference guardado: ${petPref}`)

  // Reporte
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  FASE 2 — ${results.filter(r=>r.status==='✓').length}/${results.length} checks pasaron`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  results.forEach(r => {
    if (r.status === '✓') console.log(`  ✓ ${r.name}`)
    else console.error(`  ✗ ${r.name}${r.reason ? ` — ${r.reason}` : ''}`)
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})()
```

---

## Checklist final de la Fase 2

Marca todos antes de avanzar a la Fase 3:

```
── F05: Proxy ──────────────────────────────────────────────────────
[ ] T01: fetch('/api/health') devuelve {status:'ok'} desde el browser
[ ] T02: No hay errores CORS en ninguna petición de Network

── F01: Login real + caché ─────────────────────────────────────────
[ ] T03: Login hace POST /api/auth/login + GET /api/chat/open en Network
[ ] T04: Storage tiene token en sessionStorage y user_id en localStorage
[ ] T05: Al volver al login, el user_id está pre-rellenado
[ ] T06: Logout limpia sessionStorage pero mantiene localStorage
[ ] T07: Credenciales incorrectas muestran error rojo en pantalla
[ ] T08: El primer mensaje del chat es el opening_message del trigger
[ ] T09: Cambiar de usuario cambia el opening_message del chat

── F02: PetContext ─────────────────────────────────────────────────
[ ] T10: Sin preferencia guardada, la mascota coincide con el arquetipo
[ ] T11: Cambiar mascota manualmente sobreescribe el default del arquetipo
[ ] T12: La preferencia de mascota persiste entre sesiones
[ ] T13: Limpiar preferencia restaura el default del arquetipo
[ ] T14: setUserPet actualiza localStorage y la UI simultáneamente

── F03: ScreenContext ──────────────────────────────────────────────
[ ] T15: No hay errores "useScreen must be used inside ScreenProvider"
[ ] T16: navigateTo() se llama en cada cambio de pantalla
[ ] T17: screenCache inicia vacío, sin errores

── F04: Chat conectado al backend ──────────────────────────────────
[ ] T18: Primer mensaje es el opening_message (no el genérico)
[ ] T19: Los 3 CTAs del trigger aparecen como botones
[ ] T20: Tocar un CTA lo envía como mensaje y oculta los botones
[ ] T21: La conversación libre devuelve respuestas reales de Claude
[ ] T22: El session_id es el mismo en todos los mensajes de una sesión
[ ] T23: Cambiar de usuario reinicia el chat con nuevo opening_message
[ ] T24: Un error de red muestra mensaje gracioso, no rompe la app

── Regresión ────────────────────────────────────────────────────────
[ ] T25: El flujo desktop sigue funcionando
[ ] T26: La navegación entre pantallas no lanza errores de contexto
[ ] T27: Recargar la página mantiene la sesión activa
[ ] Script pre-commit: todos los checks muestran ✓
```

---

## Problemas frecuentes

**`useAuth must be used inside AuthProvider` al navegar**
Algún componente está importando `useAuth` pero está renderizado fuera del
árbol de `AuthProvider`. Verifica que `AuthProvider` envuelve todo en `App.jsx`.

**El chat sigue mostrando respuestas hardcodeadas**
`sendMessage` todavía usa el `setTimeout` + `BOT_RESPONSES`. Verifica que la
función fue reemplazada completamente y que hace `fetch('/api/chat/message')`.

**`pet_skin` aparece en el trigger en Network**
El backend todavía devuelve `pet_skin` en `GET /chat/open`. Verifica que
`chat_service.py` o el mock JSON fueron actualizados a la v2 (sin `pet_skin`
en `trigger_active`). El script pre-commit detecta esto automáticamente.

**La mascota no cambia al hacer login con diferentes usuarios**
Dos posibles causas: (1) `applyArchetypeDefault` no se llama en `MobileApp`
cuando llega `chatOpenData`, o (2) `chatOpenData` no tiene `archetype_name`.
Verifica cuál de los dos endpoints devuelve el `archetype_name` — puede ser
necesario llamar a `GET /user/profile/:id` adicionalmente.

**El opening_message es siempre el mismo para todos los usuarios**
`chatOpenData` no se resetea al hacer logout. El `useState` en `AuthContext`
mantiene el valor anterior. Verifica que `logout()` llama `setChatOpenData(null)`.
