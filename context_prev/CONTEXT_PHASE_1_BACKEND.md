# CONTEXT_PHASE_1_BACKEND.md — Backend API (FastAPI)

> Lee CONTEXT.md global antes de este archivo.
> Prerequisito: Fase 0 completada (`mock/user_profiles.json` existe, `api/main.py` responde /health).
> Esta fase tarda ~5 horas. Trabaja en `api/`.

---

## Objetivo de esta fase

Implementar los 4 endpoints definidos en el contrato de API de CONTEXT.md.
Al terminar, cualquier cliente HTTP puede hacer login, obtener el trigger del usuario,
y tener una conversación completa con Havi — todo con datos del mock JSON.

El sistema de chat usa Claude API con un system prompt rico que incluye el perfil
completo del usuario. Eso es lo que hace que Havi "sepa quién eres".

---

## A01 — Scaffolding FastAPI completo

Completa la estructura de `api/` con los siguientes archivos.

**`api/schemas/models.py`** — todos los modelos Pydantic:
```python
from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    user_id: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user_id: str

class TriggerActive(BaseModel):
    trigger_id: str
    name: str
    opening_message: str
    ctas: list[str]
    pet_skin: str

class Transaction(BaseModel):
    fecha: str
    comercio: str
    monto: float
    categoria: str
    tipo: str

class UserProfile(BaseModel):
    user_id: str
    archetype_name: str
    cluster_id: int
    anomaly_score: float
    top_features: list[str]
    recent_transactions: list[Transaction]
    trigger_active: TriggerActive

class ChatOpenResponse(BaseModel):
    trigger_id: str
    opening_message: str
    ctas: list[str]
    pet_skin: str

class ChatMessageRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

class ChatMessageResponse(BaseModel):
    reply: str
    session_id: str
```

---

## A02 — profile_loader.py

**`api/services/profile_loader.py`**:

```python
import json
import base64
from pathlib import Path
from api.schemas.models import UserProfile

_profiles: dict[str, dict] = {}

def load_profiles(path: str = "mock/user_profiles.json"):
    """Carga los perfiles en memoria al arrancar. Llama también desde /admin/reload."""
    global _profiles
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    _profiles = {u["user_id"]: u for u in data}
    print(f"[loader] {len(_profiles)} perfiles cargados desde {path}")

def get_profile(user_id: str) -> dict | None:
    return _profiles.get(user_id)

def validate_login(user_id: str, password: str) -> bool:
    profile = _profiles.get(user_id)
    if not profile:
        return False
    return profile.get("password") == password

def make_token(user_id: str) -> str:
    return base64.b64encode(user_id.encode()).decode()

def decode_token(token: str) -> str | None:
    try:
        return base64.b64decode(token.encode()).decode()
    except Exception:
        return None
```

En `api/main.py`, llama `load_profiles()` al arrancar:
```python
from contextlib import asynccontextmanager
from api.services.profile_loader import load_profiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_profiles()
    yield

app = FastAPI(title="Havi API", version="0.1.0", lifespan=lifespan)
```

---

## A03 — Router de autenticación

**`api/routers/auth.py`**:

```python
from fastapi import APIRouter, HTTPException
from api.schemas.models import LoginRequest, LoginResponse
from api.services.profile_loader import validate_login, make_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    if not validate_login(req.user_id, req.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return LoginResponse(token=make_token(req.user_id), user_id=req.user_id)
```

---

## A04 — Router de usuarios

**`api/routers/users.py`**:

```python
from fastapi import APIRouter, HTTPException, Header
from api.schemas.models import UserProfile
from api.services.profile_loader import get_profile, decode_token

router = APIRouter(prefix="/user", tags=["users"])

def _get_user_id_from_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ", 1)[1]
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    return user_id

@router.get("/profile/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: str, authorization: str | None = Header(None)):
    _get_user_id_from_token(authorization)   # valida que haya token válido
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return profile
```

---

## A05 — GET /chat/open

Agrega a **`api/routers/chat.py`**:

```python
from fastapi import APIRouter, HTTPException, Header, Query
from api.schemas.models import ChatOpenResponse, ChatMessageRequest, ChatMessageResponse
from api.services.profile_loader import get_profile, decode_token
from api.services.chat_service import get_chat_reply

router = APIRouter(prefix="/chat", tags=["chat"])

def _auth(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    uid = decode_token(authorization.split(" ", 1)[1])
    if not uid:
        raise HTTPException(status_code=401, detail="Token inválido")
    return uid

@router.get("/open", response_model=ChatOpenResponse)
def chat_open(user_id: str = Query(...), authorization: str | None = Header(None)):
    _auth(authorization)
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    t = profile["trigger_active"]
    return ChatOpenResponse(
        trigger_id=t["trigger_id"],
        opening_message=t["opening_message"],
        ctas=t["ctas"],
        pet_skin=t["pet_skin"],
    )
```

---

## A06 — POST /chat/message (con Claude API)

**`api/services/chat_service.py`**:

```python
import os
from anthropic import Anthropic
from api.services.profile_loader import get_profile

client = Anthropic()   # lee ANTHROPIC_API_KEY del entorno

# Historial de sesiones en memoria: { session_id: [{"role":..,"content":..}] }
_sessions: dict[str, list[dict]] = {}

def _build_system_prompt(profile: dict) -> str:
    t = profile["trigger_active"]
    txs = profile.get("recent_transactions", [])
    tx_lines = "\n".join(
        f"  - {tx['fecha']} | {tx['comercio']} | ${tx['monto']} | {tx['categoria']}"
        for tx in txs
    )
    return f"""Eres Havi, el asistente virtual de Hey Banco. Tu personalidad es amigable,
directa y proactiva. Hablas en español mexicano informal pero profesional.

PERFIL DEL USUARIO:
- Arquetipo: {profile['archetype_name']}
- Características: {', '.join(profile['top_features'])}
- Score de comportamiento inusual: {profile['anomaly_score']} (0=normal, 1=muy inusual)

TRIGGER ACTIVO (la razón por la que iniciaste la conversación):
- Tipo: {t['name']}
- Mensaje inicial enviado: "{t['opening_message']}"

ÚLTIMAS TRANSACCIONES DEL USUARIO:
{tx_lines}

INSTRUCCIONES:
- Responde solo sobre temas financieros y de productos Hey Banco.
- Si el usuario acepta un CTA, da detalles concretos del producto (tasas, montos, pasos).
- Si el usuario dice "ahora no" o algo similar, despídete amablemente y ofrece ayuda futura.
- Nunca inventes cifras que no estén en el perfil.
- Mantén respuestas cortas: máximo 3-4 oraciones.
- No uses markdown en tus respuestas — solo texto plano."""

def get_chat_reply(user_id: str, session_id: str, message: str) -> str:
    profile = get_profile(user_id)
    if not profile:
        return "Lo siento, no pude encontrar tu información."

    if session_id not in _sessions:
        _sessions[session_id] = []

    _sessions[session_id].append({"role": "user", "content": message})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system=_build_system_prompt(profile),
        messages=_sessions[session_id],
    )

    reply = response.content[0].text
    _sessions[session_id].append({"role": "assistant", "content": reply})

    # Limitar historial a 20 mensajes para no crecer indefinidamente
    if len(_sessions[session_id]) > 20:
        _sessions[session_id] = _sessions[session_id][-20:]

    return reply
```

**Completar `api/routers/chat.py`** con el endpoint de mensajes:

```python
@router.post("/message", response_model=ChatMessageResponse)
def chat_message(req: ChatMessageRequest, authorization: str | None = Header(None)):
    _auth(authorization)
    reply = get_chat_reply(req.user_id, req.session_id, req.message)
    return ChatMessageResponse(reply=reply, session_id=req.session_id)
```

---

## A07 — Registrar routers en main.py y variables de entorno

**`api/main.py` final:**
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.services.profile_loader import load_profiles
from api.routers import auth, users, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_profiles()
    yield

app = FastAPI(title="Havi API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chat.router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/admin/reload")
def reload_profiles():
    """Recarga el JSON de perfiles sin reiniciar el servidor. Útil cuando DS actualiza el modelo."""
    load_profiles()
    return {"status": "reloaded"}
```

**Crear `api/.env`** (no commitear):
```
ANTHROPIC_API_KEY=sk-ant-...
```

**Cargar `.env` en `main.py`** (agregar al inicio):
```python
from dotenv import load_dotenv
load_dotenv()
```

---

## Checklist de salida de esta fase

- [ ] `GET /health` responde `{"status":"ok"}`
- [ ] `POST /auth/login` con USR-00042/demo devuelve token
- [ ] `GET /user/profile/USR-00042` con token válido devuelve el perfil completo
- [ ] `GET /chat/open?user_id=USR-00042` devuelve `opening_message` y `pet_skin`
- [ ] `POST /chat/message` devuelve una respuesta de Claude coherente con el perfil
- [ ] Cambiar de user_id (USR-00042 vs USR-00207) produce mensajes distintos
- [ ] `POST /admin/reload` recarga el JSON sin reiniciar
- [ ] No hay errores 500 con ninguno de los 5 usuarios demo

---

## Lo que NO hacer en esta fase

- No implementar persistencia real (no SQLite, no archivos de sesión) — todo en memoria.
- No implementar JWT real — el token en base64 es suficiente para el demo.
- No cambiar el esquema de respuesta de los endpoints — el frontend ya está construido
  contra el contrato de CONTEXT.md.
- No llamar al modelo ML directamente — el backend solo lee el JSON pre-computado.
