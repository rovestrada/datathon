# CONTEXT_PHASE_3_SCREENS.md — Screen-Aware JSON & Backend
## Havi 360 · Hey Banco Hackathon

> Lee CONTEXT.md global antes de este archivo.
> Prerequisito: Fase 2 completada (ScreenContext existe, proxy configurado).
> Esta fase la trabajan Dev (backend) y DS (generar screen_data JSONs) en paralelo.

---

## Objetivo

Que cada pantalla de la app tenga datos personalizados por usuario, y que HAVI
tenga acceso a esos datos para responder contextualmente a lo que el usuario está viendo.

Al final de esta fase:
- `GET /screen/home?user_id=USR-00042` devuelve datos reales de esa pantalla
- El system prompt de HAVI incluye el `havi_context` de la pantalla activa
- El frontend carga los datos de cada pantalla al entrar a ella

---

## Backend: nuevo endpoint y servicio (Dev)

### S01 — schemas/screen_models.py

```python
from pydantic import BaseModel
from typing import Any

class ScreenData(BaseModel):
    screen_id: str
    user_id:   str
    havi_context: str          # string en lenguaje natural para el system prompt
    data:      dict[str, Any]  # datos específicos de cada pantalla
```

### S02 — services/screen_loader.py

```python
import json
from pathlib import Path

_screen_data: dict[str, dict] = {}  # key: "USR-00042_home"

def load_screen_data(directory: str = "mock/screen_data") -> None:
    global _screen_data
    _screen_data = {}
    p = Path(directory)
    if not p.exists():
        print(f"[screen_loader] Directorio {directory} no existe — usando datos vacíos")
        return
    for f in p.glob("*.json"):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            key = f"{d['user_id']}_{d['screen_id']}"
            _screen_data[key] = d
        except Exception as e:
            print(f"[screen_loader] Error leyendo {f.name}: {e}")
    print(f"[screen_loader] {len(_screen_data)} screen_data cargados")

def get_screen_data(user_id: str, screen_id: str) -> dict | None:
    return _screen_data.get(f"{user_id}_{screen_id}")

def get_havi_context(user_id: str, screen_id: str) -> str:
    """Retorna el havi_context para inyectar en el system prompt."""
    d = get_screen_data(user_id, screen_id)
    if d:
        return d.get("havi_context", "")
    return f"El usuario está en la pantalla {screen_id}."
```

### S03 — routers/screens.py

```python
from fastapi import APIRouter, HTTPException, Header, Query
from api.schemas.screen_models import ScreenData
from api.services.screen_loader import get_screen_data
from api.services.profile_loader import decode_token

router = APIRouter(prefix="/screen", tags=["screens"])

def _auth(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    uid = decode_token(authorization.split(" ", 1)[1])
    if not uid:
        raise HTTPException(status_code=401, detail="Token inválido")
    return uid

@router.get("/{screen_id}", response_model=ScreenData)
def get_screen(
    screen_id: str,
    user_id: str = Query(...),
    authorization: str | None = Header(None),
):
    _auth(authorization)
    data = get_screen_data(user_id, screen_id)
    if not data:
        # Fallback: retornar estructura vacía con contexto genérico
        return ScreenData(
            screen_id=screen_id,
            user_id=user_id,
            havi_context=f"El usuario está en la sección {screen_id}.",
            data={},
        )
    return data
```

### S04 — Actualizar main.py

```python
# Agregar en api/main.py:
from api.routers import screens
from api.services.screen_loader import load_screen_data

# En la función lifespan:
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_profiles()
    load_screen_data()   # ← agregar
    yield

# Registrar router:
app.include_router(screens.router)

# Actualizar /admin/reload:
@app.post("/admin/reload")
def reload():
    load_profiles()
    load_screen_data()   # ← agregar
    return {"status": "reloaded"}
```

### S05 — Actualizar chat_service.py para screen context

```python
# En api/services/chat_service.py, actualizar _build_system_prompt
# para incluir el contexto de la pantalla activa:

from api.services.screen_loader import get_havi_context

def _build_system_prompt(profile: dict, current_screen: str = "inicio") -> str:
    t = profile["trigger_active"]
    txs = profile.get("recent_transactions", [])
    tx_lines = "\n".join(
        f"  - {tx['fecha']} | {tx['comercio']} | ${tx['monto']} | {tx['categoria']}"
        for tx in txs
    )
    # Obtener contexto de la pantalla activa
    screen_ctx = get_havi_context(profile["user_id"], current_screen)

    return f"""Eres Havi, el asistente virtual de Hey Banco. Amigable, directo y proactivo.
Hablas en español mexicano informal pero profesional.

PERFIL DEL USUARIO:
- Arquetipo: {profile['archetype_name']}
- Características: {', '.join(profile['top_features'])}
- Score de comportamiento inusual: {profile['anomaly_score']}

PANTALLA ACTUAL: {current_screen}
CONTEXTO DE LA PANTALLA:
{screen_ctx}

TRIGGER ACTIVO (inicio de la conversación):
- Tipo: {t['name']}
- Mensaje inicial: "{t['opening_message']}"

ÚLTIMAS TRANSACCIONES:
{tx_lines}

INSTRUCCIONES:
- Responde solo sobre temas financieros y de Hey Banco.
- Si el usuario quiere navegar a otra sección, incluye en tu respuesta un JSON al final:
  [NAV:{{"screen":"nombre_screen","label":"texto del botón"}}]
  Usa estos screen_ids: inicio, pagos, transferir, buzon, salud, estado, cards, ajustes, havi
- Detecta intents de navegación: "ver mis movimientos" → estado, "pagar" → pagos, etc.
- Mantén respuestas cortas: máximo 3-4 oraciones.
- No uses markdown. Solo texto plano."""
```

### S06 — Actualizar POST /chat/message para recibir current_screen

```python
# En api/schemas/models.py, actualizar ChatMessageRequest:
class ChatMessageRequest(BaseModel):
    user_id:        str
    session_id:     str
    message:        str
    current_screen: str = "inicio"   # ← agregar con default

# En api/schemas/models.py, actualizar ChatMessageResponse:
class NavigationAction(BaseModel):
    screen: str
    label:  str

class ChatMessageResponse(BaseModel):
    reply:             str
    session_id:        str
    navigation_action: NavigationAction | None = None   # ← agregar

# En api/services/chat_service.py, actualizar get_chat_reply:
import re

def get_chat_reply(user_id: str, session_id: str, message: str,
                   current_screen: str = "inicio") -> tuple[str, dict | None]:
    profile = get_profile(user_id)
    if not profile:
        return ("Lo siento, no pude encontrar tu información.", None)

    if session_id not in _sessions:
        _sessions[session_id] = []

    _sessions[session_id].append({"role": "user", "content": message})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        system=_build_system_prompt(profile, current_screen),
        messages=_sessions[session_id],
    )

    raw = response.content[0].text

    # Extraer navigation_action si está presente
    nav_action = None
    nav_match = re.search(r'\[NAV:(\{.*?\})\]', raw)
    if nav_match:
        try:
            nav_action = json.loads(nav_match.group(1))
            raw = raw[:nav_match.start()].strip()  # quitar el token del texto
        except Exception:
            pass

    _sessions[session_id].append({"role": "assistant", "content": raw})
    if len(_sessions[session_id]) > 20:
        _sessions[session_id] = _sessions[session_id][-20:]

    return (raw, nav_action)

# En api/routers/chat.py, actualizar el endpoint:
@router.post("/message", response_model=ChatMessageResponse)
def chat_message(req: ChatMessageRequest, authorization: str | None = Header(None)):
    _auth(authorization)
    reply, nav_action = get_chat_reply(
        req.user_id, req.session_id, req.message, req.current_screen
    )
    return ChatMessageResponse(
        reply=reply,
        session_id=req.session_id,
        navigation_action=nav_action,
    )
```

---

## DS: generar mock/screen_data/ (DS)

El equipo de DS genera un JSON por `(user_id, screen_id)` para los 5 usuarios demo.
Son 9 pantallas × 5 usuarios = hasta 45 archivos, pero para el pitch alcanza con:
`home`, `health`, `cards`, `inbox` × 5 usuarios (20 archivos).

El campo más importante es `havi_context` — un párrafo en lenguaje natural que
resume lo más relevante de esa pantalla para ese usuario. Claude lo usa directamente.

Ver CONTEXT.md sección "Screen Data: esquema por pantalla" para el formato completo.

**Script de validación del directorio:**
```python
import json
from pathlib import Path

REQUIRED_SCREENS = ['home', 'health', 'cards', 'inbox']
DEMO_USERS = ['USR-00042','USR-00101','USR-00207','USR-00315','USR-00489']

errors = []
for uid in DEMO_USERS:
    for screen in REQUIRED_SCREENS:
        f = Path(f"mock/screen_data/{uid}_{screen}.json")
        if not f.exists():
            errors.append(f"FALTA: {f.name}")
        else:
            d = json.loads(f.read_text())
            if not d.get("havi_context"):
                errors.append(f"SIN havi_context: {f.name}")

if errors:
    for e in errors: print(f"  ✗ {e}")
else:
    print(f"✓ Todos los screen_data válidos ({len(DEMO_USERS)*len(REQUIRED_SCREENS)} archivos)")
```

---

## Frontend: cargar screen data al navegar (Dev)

Para evitar desfases entre los nombres de las pantallas en la UI (español/interno) y los nombres de los archivos mock/endpoints del API (inglés/estándar), se utiliza un mapa de traducción:

```jsx
// En MobileApp.jsx
const SCREEN_API_MAP = {
  'inicio':     'home',
  'salud':      'health',
  'cards':      'cards',
  'buzon':      'inbox',
  'estado':     'statement',
  'pagos':      'payments',
  'transferir': 'transfer',
  'profile':    'profile'
}

const loadScreenData = async (screenId) => {
  const apiId = SCREEN_API_MAP[screenId] || screenId
  if (screenCache[apiId]) return 

  try {
    const res = await fetch(`/api/screen/${apiId}?user_id=${customerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) cacheScreenData(apiId, await res.json())
  } catch (e) {
    console.warn(`Error cargando screen:${apiId}`, e)
  }
}

// Effect de carga robusto (incluye token y customerId como dependencias)
useEffect(() => {
  if (isAuthenticated && customerId && token) {
    loadScreenData(screen)
  }
}, [isAuthenticated, customerId, token, screen])
```

---

## Nuevo contrato de API (actualización)

```
GET /screen/:screen_id?user_id=   → ScreenData { screen_id, user_id, havi_context, data }

POST /chat/message
  Request:  { user_id, session_id, message, current_screen }
  Response: { reply, session_id, navigation_action? }
  navigation_action: { screen: "pagos", label: "Ir a Pagos" }
```

---

## Checklist de salida de Fase 3

```
[ ] GET /screen/home?user_id=USR-00042 devuelve datos reales
[ ] El havi_context de home menciona el saldo y movimientos recientes del usuario
[ ] POST /chat/message acepta current_screen en el body
[ ] "quiero ver mis movimientos" devuelve navigation_action: { screen: "estado" }
[ ] "cómo están mis finanzas" devuelve navigation_action: { screen: "salud" }
[ ] Los 5 usuarios demo tienen screen_data para home, health, cards, inbox
[ ] POST /admin/reload recarga también los screen_data
[ ] El frontend carga screen_data al navegar a cada pantalla
[ ] Sin degradación del chat — los mensajes sin current_screen siguen funcionando
```
