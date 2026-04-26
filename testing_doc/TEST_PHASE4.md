# TEST_PHASE4.md — Testing de la Fase 4: HAVI Omnipresente
## Havi 360 · Hey Banco Hackathon

> Prerequisitos antes de empezar:
> - Fases 1, 2 y 3 pasando todos sus tests
> - Backend corriendo: `uvicorn api.main:app --reload --port 8000`
> - Frontend corriendo: `npm run dev` (localhost:5173)
> - screen_data JSONs disponibles en `mock/screen_data/` (al menos home, health, cards, inbox)
> - DevTools abiertos en Console + Network
> - React DevTools instalado (para tests de estado de componentes)

---

## Qué se testa en esta fase

La Fase 4 es 100% frontend — no hay cambios de backend. Los tests son todos
manuales desde el browser. Se organizan en 4 features:

| Feature | Tests | Qué verifica |
|---------|-------|--------------|
| H01 — HaviBubble contextual | T01–T07 | El bubble muestra mensaje distinto por pantalla |
| H02+H03 — Navegación por intent | T08–T14 | El botón de navegación aparece y funciona |
| H04 — HAVI en todas las pantallas | T15–T19 | Acceso a HAVI desde cualquier vista |
| H05 — Auto-aparición del bubble | T20–T24 | Bubble aparece solo en pantallas clave |
| Demo completo | T25–T27 | Los 3 usuarios del script de pitch funcionan |

---

## Setup inicial

```js
// Limpiar estado antes de empezar
localStorage.removeItem('havi_pet_preference')
sessionStorage.clear()
console.log('Estado limpio ✓')
```

Usuarios de referencia para esta fase:

| user_id | Trigger | Pantalla más interesante para testear |
|---------|---------|--------------------------------------|
| USR-00042 | T06 Inversión | Salud Financiera |
| USR-00207 | T01 Pago fallido | Estado de cuenta / Movimientos |
| USR-00489 | T02 Suscripciones | Pagos |

---

## H01 — HaviBubble contextual

### T01 — En la pantalla Inicio el bubble muestra el opening_message del trigger

1. Login con `USR-00042`
2. Observa el bubble de la mascota en la pantalla de **Inicio**

**Resultado esperado:**
- El bubble muestra el `opening_message` del trigger T06
- Contiene texto relacionado con inversión / $12,400 / rendimiento
- **No** muestra el texto genérico `"¿En qué te ayudo hoy? 👋"`

**Si muestra el texto genérico:** `HaviBubble` no está leyendo
`chatOpenData?.opening_message` del `AuthContext`, o el fallback
`SCREEN_MESSAGES.inicio` está sobreescribiendo el valor del trigger.

---

### T02 — El mensaje del bubble cambia al navegar entre pantallas

1. Login con `USR-00042`
2. Anota el mensaje del bubble en **Inicio** (trigger de inversión)
3. Navega a **Salud Financiera**
4. Espera que aparezca el bubble (puede tomar ~1.5s por el auto-show)
5. Anota el nuevo mensaje del bubble

**Resultado esperado:**
- Inicio: mensaje sobre inversión / trigger activo del usuario
- Salud Financiera: mensaje relacionado con métricas (`havi_context_short` del JSON o fallback `"¿Quieres que te explique alguna de tus métricas? 📊"`)
- Los dos mensajes son **diferentes**

**Si el mensaje no cambia:** `HaviBubble` no está recibiendo la prop `screen`
actualizada, o no está leyendo `screenCache[screen]?.havi_context_short`.

---

### T03 — Verificar mensaje por pantalla con el usuario de pago fallido

1. Login con `USR-00207` (trigger T01 — pago fallido)
2. Navega por las pantallas y verifica el mensaje del bubble en cada una:

| Pantalla | Mensaje esperado |
|----------|-----------------|
| Inicio | Menciona el pago fallido en Superama (opening_message del T01) |
| Estado/Movimientos | `havi_context_short` del JSON o `"¿Tienes dudas sobre algún movimiento? 🔍"` |
| Pagos | `havi_context_short` del JSON o `"Puedo recordarte cuándo vencen tus servicios 📅"` |
| Tarjetas | `havi_context_short` del JSON o `"¿Quieres saber cuánto puedes gastar sin intereses? 💳"` |

---

### T04 — Con screen_data disponible, el bubble usa havi_context_short

Prerequisito: los JSONs de DS tienen el campo `havi_context_short` en sus archivos.

1. Login con `USR-00042`
2. Navega a **Salud Financiera** (donde el JSON tiene `havi_context_short`)
3. Observa el texto del bubble

**Resultado esperado:** el texto del bubble es exactamente el `havi_context_short`
del JSON de DS (ej: `"Score financiero: 72/100 📊"`), no el fallback hardcodeado.

**Verificar en consola:**
```js
// Después de navegar a Salud Financiera, el screenCache debe tener el JSON
// Puedes inspeccionarlo en React DevTools → ScreenProvider → state.screenCache
// o accediendo al contexto desde la consola si está expuesto
```

---

### T05 — Sin screen_data disponible el bubble usa el fallback correcto

Para simular que no hay screen_data para una pantalla:

1. Navega a una pantalla que definitivamente no tiene JSON de DS
   (por ejemplo `ajustes` o cualquier pantalla sin archivo en `mock/screen_data/`)
2. Abre el bubble

**Resultado esperado:**
- El bubble muestra el fallback correspondiente de `SCREEN_MESSAGES`
- No aparece texto vacío ni `undefined`
- No hay errores en consola

---

### T06 — Cambiar de usuario cambia el mensaje en Inicio

1. Login con `USR-00207` → anota el mensaje del bubble en Inicio (pago fallido)
2. Logout
3. Login con `USR-00489` → observa el mensaje en Inicio (suscripciones)

**Resultado esperado:** los mensajes son completamente distintos.
`USR-00207` debe mencionar el pago rechazado.
`USR-00489` debe mencionar las suscripciones.

---

### T07 — El bubble no muestra más de 60 caracteres en pantallas con havi_context_short

En cualquier pantalla donde el JSON de DS tiene `havi_context_short`:

```js
// Medir el texto visible del bubble
const bubbleText = document.querySelector('[data-testid="havi-bubble-text"]')?.textContent
  ?? document.querySelector('.havi-bubble p')?.textContent
  ?? 'no encontrado'
console.log('Texto del bubble:', bubbleText)
console.log('Longitud:', bubbleText.length)
console.assert(bubbleText.length <= 60, `⚠ Bubble muy largo: ${bubbleText.length} chars`)
```

**Si el texto supera 60 chars:** el `havi_context_short` del JSON de DS excede
el límite o `HaviBubble` no está truncando. El límite es importante porque en
mobile el bubble se ve cortado visualmente si es muy largo.

---

## H02+H03 — Navegación por intent (botón en mensajes)

### T08 — Intent de navegación genera botón bajo el mensaje de HAVI

1. Login con cualquier usuario demo
2. Abre el chat de HAVI
3. Escribe: **"quiero ver mis movimientos"**
4. Espera la respuesta de HAVI

**Resultado esperado:**
- HAVI responde con texto coherente
- **Debajo del mensaje** aparece un botón con estilo violeta/morado
- El botón tiene un label como `"Ver movimientos →"` o `"Ir a Estado de cuenta →"`
- El botón es distinto visualmente a los CTAs del trigger inicial

**Si el botón no aparece:**
- Verifica en Network que `POST /api/chat/message` devuelve `navigation_action` no null
- Si la API sí lo devuelve pero el botón no aparece: el componente `BotMessage`
  no está renderizando `msg.navigation_action`

---

### T09 — El botón de navegación lleva a la pantalla correcta

Continuando desde T08 (botón visible):

1. Toca el botón de navegación *"Ver movimientos →"*

**Resultado esperado:**
- La app **navega** a la pantalla de Estado/Movimientos
- El chat se cierra o queda en segundo plano (según el diseño del equipo)
- La URL o el estado de `screen` en `MobileApp` cambia a `"estado"`

**Verifica en React DevTools:** el state `screen` de `MobileApp` debe cambiar
al tocar el botón.

---

### T10 — Tabla completa de intents → pantallas

Prueba cada intent y verifica que la app navega a la pantalla correcta.
Usa `USR-00042` para todos:

```
Intent enviado                        → Pantalla esperada
─────────────────────────────────────────────────────────
"quiero ver mis movimientos"          → estado
"muéstrame mis pagos pendientes"      → pagos
"quiero transferir dinero"            → transferir
"cómo están mis finanzas"             → salud
"ver mis tarjetas"                    → cards
"quiero ir al inicio"                 → inicio
"ver mis notificaciones"              → buzon
"mis ajustes"                         → ajustes
```

Para cada uno: abre el chat, escribe el mensaje, observa si aparece botón y
si al tocarlo va a la pantalla correcta. Usa una nueva sesión para cada intent
(cierra y abre el chat entre pruebas) para evitar que el historial influya.

**Resultado esperado:** al menos 5 de 8 intents generan un botón con la
pantalla correcta. Claude puede interpretar algunos de forma diferente —
lo que importa es que `navigation_action` llega del backend y el frontend
lo convierte en botón funcional.

---

### T11 — El botón de navegación no aparece en mensajes sin intent

1. Abre el chat con `USR-00042`
2. Escribe un mensaje que no implica navegación: **"¿cuánto cashback tengo?"**

**Resultado esperado:**
- HAVI responde con información sobre cashback
- **No** aparece ningún botón de navegación bajo el mensaje
- `navigation_action` en Network es `null`

---

### T12 — Múltiples intents en una sesión generan múltiples botones

1. Abre el chat
2. Escribe: **"quiero transferir"** → aparece botón
3. Sin cerrar el chat, escribe: **"mejor enséñame mis pagos"**

**Resultado esperado:**
- El primer mensaje tiene su botón de navegación (transferir)
- El segundo mensaje tiene su propio botón (pagos)
- Los botones de mensajes anteriores siguen visibles en el historial del chat
- Cada botón lleva a su pantalla correspondiente de forma independiente

---

### T13 — El botón no navega automáticamente (el usuario elige)

Cuando `navigation_action` está presente en la respuesta:

**Resultado esperado:**
- La app **NO navega automáticamente** al recibir la respuesta
- El usuario **debe tocar el botón** para que ocurra la navegación
- Si el usuario ignora el botón y sigue escribiendo, el chat continúa normalmente

Este comportamiento es intencional — dar control al usuario, no redirigirlo
sin su consentimiento.

---

### T14 — Verificar en Network que navigation_action llega del backend

1. Abre DevTools → Network
2. Escribe **"quiero ver mis pagos"** en el chat

**En Network, inspecciona el POST /api/chat/message:**

```json
// Request body (verifica que va current_screen):
{
  "user_id": "USR-00042",
  "session_id": "...",
  "message": "quiero ver mis pagos",
  "current_screen": "havi"
}

// Response body esperada:
{
  "reply": "Claro, te llevo a la sección de pagos...",
  "session_id": "...",
  "navigation_action": {
    "screen": "pagos",
    "label": "Ir a Pagos"
  }
}
```

Si `navigation_action` es `null` en la respuesta pero el backend debería
detectarlo: el system prompt del backend no está instruyendo correctamente
a Claude para emitir el token `[NAV:{...}]`. Revisa `_build_system_prompt`
en `chat_service.py`.

---

## H04 — HAVI accesible desde todas las pantallas

### T15 — HAVI es accesible desde las pantallas con navbar

Verifica en cada pantalla con barra de navegación inferior:

| Pantalla | Cómo acceder a HAVI | Funciona |
|----------|---------------------|---------|
| Inicio | Botón central HAVI en navbar | ☐ |
| Pagos | Botón central HAVI en navbar | ☐ |
| Transferir | Botón central HAVI en navbar | ☐ |
| Buzón | Botón central HAVI en navbar | ☐ |

Para cada una: navega a la pantalla → toca el botón HAVI central → verifica
que el chat se abre. Si el chat no se abre desde alguna pantalla específica,
el evento `onClick` del botón no está propagando correctamente en ese contexto.

---

### T16 — HAVI es accesible desde pantallas SIN navbar

Las pantallas secundarias (Salud Financiera, Estado de cuenta) no tienen navbar.
HAVI debe estar disponible via otro mecanismo.

**Escenario A — Pet habilitada (mascota visible):**
1. Asegúrate de que `petEnabled = true` en `MobileApp`
2. Navega a **Salud Financiera**
3. Toca la mascota → aparece el bubble
4. Toca el bubble → abre el chat de HAVI

**Escenario B — Pet deshabilitada:**
1. Desactiva la mascota en Ajustes (si hay esa opción)
2. Navega a **Salud Financiera**
3. Debe aparecer un botón flotante de esquina para abrir HAVI
4. Toca el botón → abre el chat

**Si en ningún escenario HAVI es accesible desde Salud Financiera:** la variable
`showHAVICorner` no está activándose, o no está renderizando el botón.

---

### T17 — Desde cada pantalla el chat abre con el contexto correcto

1. Navega a **Tarjetas**
2. Abre HAVI desde esa pantalla
3. Pregunta: **"¿cuánto disponible tengo?"**

**Resultado esperado:** HAVI responde con el saldo disponible de la tarjeta
del usuario, no una respuesta genérica. Esto verifica que `current_screen`
se está enviando correctamente desde esa pantalla específica.

4. Repite desde **Pagos**: pregunta **"¿cuándo vence mi CFE?"**

**Resultado esperado:** HAVI responde con información sobre el servicio CFE
del usuario (viene del `havi_context` de la pantalla pagos).

---

### T18 — El botón HAVI de la navbar funciona en modo landscape / tablet

Prueba en DevTools con viewport de 768px (modo tablet):

1. En DevTools → Device toolbar → selecciona iPad Air o similar
2. Navega por la app
3. Verifica que el botón central HAVI sigue siendo visible y funcional
4. El chat se abre correctamente

---

### T19 — Cerrar el chat regresa a la pantalla anterior, no al inicio

1. Navega a **Salud Financiera**
2. Abre HAVI desde ahí
3. Cierra el chat (botón ✕ o gesto de swipe)

**Resultado esperado:** la app muestra **Salud Financiera**, no el Inicio.
El chat es una capa encima de la pantalla actual — al cerrarlo, vuelve a lo
que había debajo.

**Si cierra y va al Inicio:** `onClose` del chat está llamando `goTo('inicio')`
en lugar de solo desmontar el chat sobre la pantalla actual.

---

## H05 — Auto-aparición del bubble

### T20 — El bubble aparece automáticamente en Salud Financiera

1. Login con `USR-00042`
2. Navega a **Salud Financiera**
3. No toques nada — espera

**Resultado esperado:**
- Entre 1 y 2 segundos después de entrar a la pantalla, el bubble aparece solo
- El mensaje del bubble es el de esa pantalla (no el del trigger de inicio)
- La mascota hace una pequeña animación de idle al mostrar el bubble

**Timing:** el bubble debe aparecer en el rango 1.0–2.5 segundos.
Si aparece inmediatamente (< 0.5s): el timeout es demasiado corto.
Si tarda más de 3s: el timeout es demasiado largo para el pitch.

---

### T21 — El bubble aparece automáticamente en Estado de Cuenta

Mismo test que T20, pero en la pantalla de **Estado/Movimientos**:

1. Navega a Estado de Cuenta
2. Espera sin tocar nada

**Resultado esperado:** el bubble aparece automáticamente con el mensaje
de esa pantalla (ej: `"¿Tienes dudas sobre algún movimiento? 🔍"`).

---

### T22 — El bubble NO aparece automáticamente en pantallas normales

Navega a estas pantallas y espera 5 segundos sin tocar nada:
- Inicio
- Pagos
- Transferir
- Buzón

**Resultado esperado:** el bubble **NO** aparece solo en ninguna de estas
pantallas. El auto-show está limitado a Salud Financiera y Estado de Cuenta.

Si el bubble aparece en todas las pantallas: el `useEffect` de auto-show
no tiene la condición `if (screen === 'salud' || screen === 'estado')`.

---

### T23 — El bubble auto-shown se puede cerrar y no vuelve a aparecer

1. Navega a **Salud Financiera**
2. Espera que el bubble aparezca automáticamente
3. Ciérralo (toca fuera del bubble o el botón de cerrar)
4. Espera otros 3 segundos

**Resultado esperado:** el bubble **no** vuelve a aparecer solo. El auto-show
ocurre una vez por visita a la pantalla, no en un loop.

---

### T24 — Al volver a la misma pantalla, el auto-show ocurre de nuevo

1. Navega a **Salud Financiera** → bubble aparece → ciérralo
2. Navega a **Inicio**
3. Vuelve a **Salud Financiera**

**Resultado esperado:** el bubble vuelve a aparecer automáticamente (ya que
entraste de nuevo a la pantalla). El auto-show se dispara al entrar,
no queda bloqueado por haberlo cerrado anteriormente.

---

## Demo completo — script del pitch

### T25 — Usuario 1: HAVI proactivo sobre pago fallido y navegación

Script exacto del pitch con `USR-00207`:

```
1. Login con USR-00207
2. Verificar: bubble muestra "Tu pago de $876 en Superama no pasó" (o similar)
3. Click en el bubble → se abre el chat con el opening_message del T01
4. Tocar CTA "Activar alerta de saldo"
5. HAVI responde → aparece botón "Ver mis movimientos →"
6. Tocar el botón → app navega a Estado de cuenta
7. [Para el pitch]: "HAVI detectó tu problema y te llevó exactamente donde necesitabas"
```

**Checklist T25:**
- [ ] Bubble muestra mensaje contextual del trigger T01
- [ ] Chat abre con opening_message personalizado
- [ ] CTA envía el mensaje y desaparece
- [ ] Botón de navegación aparece tras la respuesta
- [ ] Botón lleva correctamente a Estado de cuenta
- [ ] Flujo completo tarda menos de 30 segundos

---

### T26 — Usuario 2: HAVI screen-aware en Salud Financiera

Script exacto del pitch con `USR-00042`:

```
1. Login con USR-00042
2. Navegar a Salud Financiera
3. Esperar que el bubble aparezca automáticamente (~1.5s)
4. Verificar: mensaje del bubble es sobre métricas financieras
5. Click en el bubble → abre el chat
6. Escribir: "¿cómo puedo mejorar mi score?"
7. HAVI responde con contexto de la pantalla (menciona gasto en restaurantes / utilización)
8. [Para el pitch]: "HAVI sabe exactamente en qué pantalla estás"
```

**Checklist T26:**
- [ ] Bubble auto-aparece entre 1–2.5 segundos
- [ ] Mensaje del bubble es de Salud Financiera, no del trigger de inicio
- [ ] Respuesta de HAVI menciona datos de salud financiera del usuario
- [ ] Flujo se siente natural, sin fricciones

---

### T27 — Usuario 3: HAVI infiere intent y redirige

Script exacto del pitch con `USR-00489`:

```
1. Login con USR-00489
2. Desde el Inicio, abrir el chat de HAVI (botón central)
3. Escribir: "quiero revisar mis pagos recurrentes"
4. HAVI responde + aparece botón "Ir a Pagos →" (o similar)
5. Tocar el botón
6. App navega a Pagos
7. [Para el pitch]: "HAVI entiende lo que quieres sin que le digas la pantalla exacta"
```

**Checklist T27:**
- [ ] HAVI responde con texto coherente sobre pagos
- [ ] Aparece botón de navegación hacia Pagos
- [ ] Al tocarlo, la app va a la pantalla correcta
- [ ] El botón tiene un label descriptivo (no genérico como "Ir aquí")

---

## Script de verificación rápida en browser

Ejecuta esto en la consola tras hacer login con `USR-00042`:

```js
(async () => {
  const results = []
  const ok   = name => results.push({ ok: true, name })
  const fail = (name, why) => results.push({ ok: false, name, why })
  const warn = (name, why) => results.push({ ok: null, name, why })

  const tok = sessionStorage.getItem('havi_token')
  const uid = sessionStorage.getItem('havi_customer_id')
  if (!tok || !uid) { console.error('Sin sesión — haz login primero'); return }
  const HDR = { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }

  // 1. HaviBubble: el bubble existe en el DOM
  const bubbleEl = document.querySelector('[class*="bubble"]') ||
                   document.querySelector('[class*="Bubble"]') ||
                   document.querySelector('[class*="speech"]')
  bubbleEl
    ? ok('HaviBubble presente en el DOM')
    : warn('HaviBubble', 'no encontrado en el DOM — puede que esté oculto (es normal si no se ha activado)')

  // 2. navigation_action en respuesta del chat
  try {
    const r = await fetch('/api/chat/message', {
      method: 'POST', headers: HDR,
      body: JSON.stringify({
        user_id: uid, session_id: crypto.randomUUID(),
        message: 'quiero ver mis movimientos', current_screen: 'havi'
      })
    })
    const d = await r.json()
    r.ok
      ? ok('POST /chat/message con intent de navegación → 200')
      : fail('POST /chat/message', `status ${r.status}`)
    'navigation_action' in d
      ? ok('Campo navigation_action presente en respuesta')
      : fail('navigation_action', 'campo ausente del schema de respuesta')
    d.navigation_action !== undefined
      ? (d.navigation_action
          ? ok(`navigation_action detectado: screen="${d.navigation_action.screen}", label="${d.navigation_action.label}"`)
          : warn('navigation_action es null', 'Claude no generó intent — puede ser normal, reintentar'))
      : fail('navigation_action', 'undefined — el backend no lo está devolviendo')
    !d.reply?.includes('[NAV:')
      ? ok('[NAV:] limpio del reply')
      : fail('[NAV:] en reply', 'el token de navegación contamina el texto visible')
  } catch(e) { fail('POST /chat/message', e.message) }

  // 3. Backward compat: sin navigation_action en mensajes normales
  try {
    const r = await fetch('/api/chat/message', {
      method: 'POST', headers: HDR,
      body: JSON.stringify({
        user_id: uid, session_id: crypto.randomUUID(),
        message: '¿cuánto cashback tengo?', current_screen: 'inicio'
      })
    })
    const d = await r.json()
    const nav = d.navigation_action
    !nav
      ? ok('Sin navigation_action en pregunta sin intent de navegación')
      : warn('navigation_action en pregunta sin intent', `screen: ${nav?.screen} — puede ser falso positivo`)
  } catch(e) { fail('Chat mensaje normal', e.message) }

  // 4. Screen data cargado para pantallas visitadas
  try {
    const r = await fetch(`/api/screen/health?user_id=${uid}`, { headers: HDR })
    const d = await r.json()
    const short = d.data?.havi_context_short ?? d.havi_context_short
    short
      ? ok(`havi_context_short en health: "${short}"`)
      : warn('havi_context_short en health', 'campo ausente — bubble usará fallback hardcodeado')
  } catch(e) { fail('GET /screen/health', e.message) }

  // Reporte
  const passed  = results.filter(r => r.ok === true).length
  const warned  = results.filter(r => r.ok === null).length
  const failed  = results.filter(r => r.ok === false).length
  console.log(`\n${'━'.repeat(56)}`)
  console.log(`  FASE 4 — ${passed} OK · ${warned} advertencias · ${failed} fallos`)
  console.log(`${'━'.repeat(56)}`)
  results.forEach(r => {
    const icon = r.ok === true ? '✓' : r.ok === null ? '⚠' : '✗'
    const line = `  ${icon} ${r.name}`
    r.ok === false ? console.error(line + (r.why ? ` — ${r.why}` : '')) :
    r.ok === null  ? console.warn(line  + (r.why ? ` — ${r.why}` : '')) :
                     console.log(line)
  })
  console.log(`${'━'.repeat(56)}`)
})()
```

---

## Checklist final de la Fase 4

```
── H01: HaviBubble contextual ────────────────────────────────────────
[ ] T01: En Inicio el bubble muestra el opening_message del trigger
[ ] T02: El mensaje del bubble cambia al navegar entre pantallas
[ ] T03: Con USR-00207, cada pantalla muestra su mensaje específico
[ ] T04: Con screen_data disponible, se usa havi_context_short del JSON
[ ] T05: Sin screen_data, el fallback hardcodeado se muestra sin errores
[ ] T06: Cambiar de usuario cambia el mensaje en Inicio
[ ] T07: El texto del bubble no supera 60 caracteres

── H02+H03: Navegación por intent ────────────────────────────────────
[ ] T08: Intent de navegación genera botón visible bajo el mensaje
[ ] T09: Tocar el botón navega a la pantalla correcta
[ ] T10: Al menos 5/8 intents de la tabla generan el botón correcto
[ ] T11: Mensajes sin intent NO generan botón de navegación
[ ] T12: Múltiples intents en la misma sesión generan múltiples botones
[ ] T13: La navegación es manual (usuario decide) — no automática
[ ] T14: En Network, navigation_action llega del backend cuando aplica

── H04: HAVI en todas las pantallas ──────────────────────────────────
[ ] T15: Botón HAVI central funciona en las 4 pantallas con navbar
[ ] T16: HAVI es accesible en Salud Financiera y Estado (sin navbar)
[ ] T17: Desde cada pantalla el chat usa current_screen correcto
[ ] T18: Funciona en viewport de tablet (768px)
[ ] T19: Cerrar el chat regresa a la pantalla anterior, no al Inicio

── H05: Auto-aparición del bubble ────────────────────────────────────
[ ] T20: Bubble aparece solo en Salud Financiera (entre 1–2.5s)
[ ] T21: Bubble aparece solo en Estado de Cuenta (entre 1–2.5s)
[ ] T22: Bubble NO aparece solo en Inicio, Pagos, Transferir, Buzón
[ ] T23: El bubble auto-shown se puede cerrar y no reaparece solo
[ ] T24: Al volver a la pantalla, el auto-show ocurre de nuevo

── Demo del pitch ─────────────────────────────────────────────────────
[ ] T25: USR-00207 — pago fallido → botón → navega a movimientos
[ ] T26: USR-00042 — Salud Financiera → bubble auto → respuesta contextual
[ ] T27: USR-00489 — intent en chat → botón → navega a Pagos
[ ] Script pre-commit: 0 fallos (advertencias son aceptables)
```

---

## Problemas frecuentes

**El bubble siempre muestra el mismo mensaje en todas las pantallas**
`HaviBubble` no está leyendo la prop `screen` ni el `screenCache`.
Verifica que recibe la prop `screen` actualizada desde `MobileApp` y que
el componente hace `screenCache[screen]?.havi_context_short`.

**El botón de navegación nunca aparece aunque el backend sí devuelve navigation_action**
El componente `BotMessage` no guarda `msg.navigation_action` en el estado del mensaje,
o el JSX que renderiza el botón tiene la condición incorrecta.
Verifica: `{msg.navigation_action && onNavigate && <button>...}`.

**La navegación ocurre automáticamente sin que el usuario toque el botón**
El código está llamando `onNavigate(nav.screen)` directamente al recibir
la respuesta, en lugar de guardarlo en el mensaje y esperar el click.
La lógica correcta: guardar `navigation_action` en el objeto del mensaje,
renderizar el botón, y solo navegar en el `onClick` del botón.

**El bubble auto-show no respeta el timing (aparece demasiado rápido o lento)**
El `setTimeout` tiene un valor incorrecto. Para el pitch, 1500ms (1.5s) es
el valor óptimo — suficiente para que el usuario vea la pantalla, pero sin
hacer esperar.

**Al cerrar el chat desde Salud Financiera la app va al Inicio**
`onClose` está llamando `goTo('inicio')` en lugar de simplemente setear
`chatOpen = false`. El chat es un overlay — cerrarlo no debe cambiar de pantalla.

**navigation_action nunca llega del backend para ningún intent**
El system prompt en `_build_system_prompt` no incluye la instrucción de
emitir el token `[NAV:{...}]`, o el regex de extracción en `get_chat_reply`
no está funcionando. Revisa que el patrón sea `r'\[NAV:(\{.*?\})\]'`.
