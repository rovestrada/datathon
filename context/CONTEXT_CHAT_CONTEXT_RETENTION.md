# CONTEXT_CHAT_CONTEXT_RETENTION.md — Retención de Contexto en el Chat
## Havi 360 · Hey Banco Hackathon

> Lee CONTEXT.md global antes de este archivo.
> Prerequisito: Fase 1 implementada y pasando todos sus tests.
> Esta mejora se implementa sobre `api/services/chat_service.py` y
> `api/schemas/models.py`. No requiere cambios en el frontend
> más allá de enviar `current_screen` en cada mensaje (ya definido en Fase 3).

---

## El problema actual

El `chat_service.py` actual tiene tres debilidades concretas:

**1. Truncado ciego del historial.**
Cuando la sesión supera 20 mensajes, se cortan los más antiguos sin importar
su contenido. Si el usuario reveló algo importante en el mensaje 3
("tengo tres hijos y quiero ahorrar para su educación"), ese dato se pierde
en el mensaje 24 y Havi lo olvida permanentemente.

**2. System prompt estático.**
Se construye una vez con el perfil ML y no cambia durante la conversación.
Todo lo que el usuario comparte (metas, preferencias, correcciones, información
personal) vive solo en el historial de mensajes — y se pierde con el truncado.

**3. Sin contexto de pantalla.**
El endpoint actual ignora en qué pantalla está el usuario. Havi no sabe si
el usuario está mirando sus tarjetas o su salud financiera cuando hace una pregunta.

---

## La solución: User Memory Layer

Separar en tres capas lo que hoy está mezclado en un solo array de mensajes:

```
┌─────────────────────────────────────────────────────┐
│  SYSTEM PROMPT (estático por usuario)                │
│  - Perfil ML (arquetipo, top_features, anomaly)      │
│  - Transacciones recientes                           │
│  - Trigger activo                                    │
│  - Screen data de la pantalla activa                 │
│  - Instrucciones de comportamiento                   │
├─────────────────────────────────────────────────────┤
│  USER MEMORY (dinámico, crece con la conversación)   │  ← NUEVO
│  - Metas financieras mencionadas                     │
│  - Preferencias declaradas                           │
│  - Correcciones al perfil ML                         │
│  - Información personal relevante compartida         │
│  - Decisiones tomadas en esta sesión                 │
├─────────────────────────────────────────────────────┤
│  HISTORIAL DE MENSAJES (ventana deslizante)          │
│  - Solo los últimos N turnos                         │
│  - Se trunca, pero lo importante ya está en Memory   │
└─────────────────────────────────────────────────────┘
```

**El principio clave:** la memoria de usuario se extrae automáticamente del
historial antes de truncarlo. El historial puede olvidar — la memoria no.

---

## Arquitectura del nuevo chat_service.py

### Estructura de datos en memoria

```python
# Antes (solo historial):
_sessions: dict[str, list[dict]] = {}

# Después (historial + memoria de usuario):
_sessions: dict[str, list[dict]] = {}   # historial de mensajes
_user_memory: dict[str, dict] = {}      # memoria acumulada por sesión
```

### Esquema del objeto de memoria por sesión

```python
{
    "session_id": "uuid",
    "user_id": "USR-00042",
    "created_at": "2025-10-05T10:30:00",
    "last_updated": "2025-10-05T10:45:00",
    "turn_count": 12,

    # Lo que el usuario reveló sobre sí mismo:
    "user_stated": {
        "metas": [],           # ["quiero ahorrar para una casa", "pagar deuda en 6 meses"]
        "preocupaciones": [],  # ["tengo miedo de quedarme sin trabajo"]
        "preferencias": [],    # ["prefiero no invertir en bolsa", "no me gustan los créditos"]
        "contexto_personal": [], # ["tengo 2 hijos", "soy freelancer", "recibo pago en dólares"]
        "correcciones": [],    # ["no uso Netflix, eso fue un cargo de mi esposa"]
    },

    # Decisiones tomadas en esta sesión:
    "decisions": {
        "accepted_ctas": [],   # CTAs que el usuario aceptó
        "rejected_ctas": [],   # CTAs que rechazó
        "topics_explored": [], # ["inversión Hey", "alertas de saldo", "crédito personal"]
        "actions_taken": [],   # ["solicitó simulación de crédito", "pidió activar alerta"]
    },

    # Pantallas visitadas durante la sesión:
    "screens_visited": [],     # ["inicio", "salud", "cards"]
    "current_screen": "inicio",

    # Resumen generado automáticamente (se actualiza cada 5 turnos):
    "summary": ""  # "El usuario preguntó sobre inversión, rechazó Hey Pro, ..."
}
```

---

## Implementación completa

### Archivo: `api/services/chat_service.py` — REEMPLAZAR COMPLETO

```python
import os
import json
import re
from datetime import datetime
from anthropic import Anthropic
from api.services.profile_loader import get_profile

try:
    from api.services.screen_loader import get_havi_context
    SCREEN_LOADER_AVAILABLE = True
except ImportError:
    SCREEN_LOADER_AVAILABLE = False

client = Anthropic()

# ── Almacenamiento en memoria ────────────────────────────────────────────────

# Historial de mensajes por sesión: { session_id: [{"role":..,"content":..}] }
_sessions:    dict[str, list[dict]] = {}

# Memoria acumulada por sesión: { session_id: dict }
_user_memory: dict[str, dict]       = {}

# Configuración
MAX_HISTORY_MESSAGES = 12   # mensajes en la ventana deslizante
MEMORY_EXTRACT_EVERY = 4    # extraer memoria cada N turnos del usuario
SUMMARY_EVERY        = 8    # regenerar resumen cada N turnos del usuario


# ── Inicialización de sesión ─────────────────────────────────────────────────

def _init_session(session_id: str, user_id: str, current_screen: str = "inicio") -> None:
    """Inicializa historial y memoria para una sesión nueva."""
    if session_id not in _sessions:
        _sessions[session_id] = []
    if session_id not in _user_memory:
        _user_memory[session_id] = {
            "session_id":  session_id,
            "user_id":     user_id,
            "created_at":  datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat(),
            "turn_count":  0,
            "user_stated": {
                "metas":            [],
                "preocupaciones":   [],
                "preferencias":     [],
                "contexto_personal":[],
                "correcciones":     [],
            },
            "decisions": {
                "accepted_ctas":   [],
                "rejected_ctas":   [],
                "topics_explored": [],
                "actions_taken":   [],
            },
            "screens_visited": [current_screen],
            "current_screen":  current_screen,
            "summary":         "",
        }


# ── Extracción de memoria ────────────────────────────────────────────────────

_EXTRACT_SYSTEM = """Eres un extractor de información financiera personal. 
Analiza el último mensaje del usuario y extrae SOLO información nueva y relevante.
Responde ÚNICAMENTE con un JSON válido y nada más. Si no hay nada que extraer, 
responde con un JSON con todas las listas vacías.

Formato de respuesta:
{
  "metas": [],
  "preocupaciones": [],
  "preferencias": [],
  "contexto_personal": [],
  "correcciones": [],
  "accepted_ctas": [],
  "rejected_ctas": [],
  "topics_explored": [],
  "actions_taken": []
}

Reglas:
- metas: objetivos financieros mencionados ("quiero ahorrar para X", "necesito pagar Y")
- preocupaciones: miedos o problemas financieros ("me preocupa X", "tengo problemas con Y")
- preferencias: lo que le gusta o no le gusta ("prefiero X", "no me gusta Y")
- contexto_personal: datos personales relevantes (familia, trabajo, ingresos, situación)
- correcciones: cuando el usuario corrige algo del perfil o desmiente una suposición
- accepted_ctas: si aceptó explícitamente una oferta o acción de HAVI
- rejected_ctas: si rechazó explícitamente una oferta ("no gracias", "ahora no", "no me interesa")
- topics_explored: temas sobre los que preguntó (inversión, crédito, cashback, etc.)
- actions_taken: acciones concretas solicitadas ("quiero activar X", "simula Y")
Solo incluye strings cortos (máximo 80 chars cada uno). Sin duplicar lo que ya está en memoria."""


def _extract_memory_update(
    user_message: str,
    existing_memory: dict,
    profile: dict,
) -> dict:
    """
    Llama a Claude para extraer información nueva del último mensaje del usuario.
    Retorna un dict con los campos a actualizar en la memoria.
    Usa claude-haiku para minimizar latencia y costo.
    """
    existing_summary = json.dumps({
        "lo_que_ya_se": {
            "metas":            existing_memory["user_stated"]["metas"][-3:],
            "preferencias":     existing_memory["user_stated"]["preferencias"][-3:],
            "contexto_personal":existing_memory["user_stated"]["contexto_personal"][-3:],
        }
    }, ensure_ascii=False)

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",  # haiku: rápido y barato para extracción
            max_tokens=400,
            system=_EXTRACT_SYSTEM,
            messages=[{
                "role": "user",
                "content": (
                    f"Perfil base del usuario: arquetipo={profile.get('archetype_name','')}, "
                    f"features={', '.join(profile.get('top_features',[]))}\n\n"
                    f"Lo que ya sé del usuario: {existing_summary}\n\n"
                    f"Nuevo mensaje del usuario: \"{user_message}\"\n\n"
                    f"Extrae SOLO información nueva que no esté ya en 'lo_que_ya_se'."
                )
            }],
        )
        raw = response.content[0].text.strip()
        # Limpiar posibles backticks de markdown
        raw = re.sub(r"^```json\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        return json.loads(raw)
    except Exception:
        return {}  # Si falla la extracción, no romper el flujo principal


def _apply_memory_update(memory: dict, update: dict) -> None:
    """Aplica el resultado de la extracción a la memoria de la sesión."""
    if not update:
        return

    stated = memory["user_stated"]
    decisions = memory["decisions"]

    for key in ("metas", "preocupaciones", "preferencias", "contexto_personal", "correcciones"):
        new_items = update.get(key, [])
        for item in new_items:
            if isinstance(item, str) and item.strip() and item not in stated[key]:
                stated[key].append(item.strip())

    for key in ("accepted_ctas", "rejected_ctas", "topics_explored", "actions_taken"):
        new_items = update.get(key, [])
        for item in new_items:
            if isinstance(item, str) and item.strip() and item not in decisions[key]:
                decisions[key].append(item.strip())

    memory["last_updated"] = datetime.utcnow().isoformat()


# ── Resumen de sesión ────────────────────────────────────────────────────────

_SUMMARY_SYSTEM = """Eres un resumidor de conversaciones bancarias.
Escribe un resumen factual y conciso (máximo 3 oraciones) de lo que ha pasado
en esta sesión de chat hasta ahora. Enfócate en: qué quería el usuario, qué
decidió, y qué información importante compartió. Responde SOLO con el texto
del resumen, sin encabezados ni formato."""


def _regenerate_summary(memory: dict, history: list[dict], profile: dict) -> str:
    """Genera un resumen narrativo de la sesión para incluir en el system prompt."""
    try:
        stated   = memory["user_stated"]
        decisions = memory["decisions"]

        context = (
            f"Usuario: {profile.get('archetype_name','')}. "
            f"Pantallas visitadas: {', '.join(memory['screens_visited'])}. "
            f"Temas explorados: {', '.join(decisions['topics_explored'])}. "
            f"Metas mencionadas: {', '.join(stated['metas'])}. "
            f"CTAs aceptados: {', '.join(decisions['accepted_ctas'])}. "
            f"CTAs rechazados: {', '.join(decisions['rejected_ctas'])}. "
            f"Contexto personal: {', '.join(stated['contexto_personal'])}."
        )

        # Incluir los últimos 6 mensajes para capturar el hilo reciente
        recent = "\n".join(
            f"{m['role'].upper()}: {m['content'][:100]}"
            for m in history[-6:]
        )

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            system=_SUMMARY_SYSTEM,
            messages=[{
                "role": "user",
                "content": f"Datos de la sesión:\n{context}\n\nÚltimos mensajes:\n{recent}"
            }],
        )
        return response.content[0].text.strip()
    except Exception:
        return ""


# ── System prompt enriquecido ────────────────────────────────────────────────

def _build_system_prompt(
    profile: dict,
    memory: dict,
    current_screen: str = "inicio",
) -> str:
    """
    Construye el system prompt completo con toda la información disponible:
    perfil ML + screen data + memoria acumulada de la sesión.
    """
    t   = profile["trigger_active"]
    txs = profile.get("recent_transactions", [])

    tx_lines = "\n".join(
        f"  - {tx['fecha']} | {tx['comercio']} | ${tx['monto']:.0f} MXN"
        f" | {tx['categoria']} | {tx['tipo']}"
        + (f" | ⚠ RECHAZADA: {tx.get('motivo','')}" if tx.get("estatus") == "no_procesada" else "")
        for tx in txs
    )

    # Screen context (si está disponible de Fase 3)
    screen_ctx = ""
    if SCREEN_LOADER_AVAILABLE:
        ctx = get_havi_context(profile["user_id"], current_screen)
        if ctx:
            screen_ctx = f"\nCONTEXTO DE LA PANTALLA ACTUAL ({current_screen.upper()}):\n{ctx}"

    # Memoria acumulada de la sesión
    stated    = memory["user_stated"]
    decisions = memory["decisions"]

    memory_lines = []
    if stated["metas"]:
        memory_lines.append(f"Metas que mencionó: {'; '.join(stated['metas'])}")
    if stated["preocupaciones"]:
        memory_lines.append(f"Preocupaciones: {'; '.join(stated['preocupaciones'])}")
    if stated["preferencias"]:
        memory_lines.append(f"Preferencias declaradas: {'; '.join(stated['preferencias'])}")
    if stated["contexto_personal"]:
        memory_lines.append(f"Contexto personal: {'; '.join(stated['contexto_personal'])}")
    if stated["correcciones"]:
        memory_lines.append(f"Correcciones al perfil: {'; '.join(stated['correcciones'])}")
    if decisions["accepted_ctas"]:
        memory_lines.append(f"Lo que aceptó: {'; '.join(decisions['accepted_ctas'])}")
    if decisions["rejected_ctas"]:
        memory_lines.append(f"Lo que rechazó (no volver a ofrecer): {'; '.join(decisions['rejected_ctas'])}")
    if decisions["topics_explored"]:
        memory_lines.append(f"Temas explorados hoy: {'; '.join(decisions['topics_explored'])}")

    memory_section = ""
    if memory_lines:
        memory_section = "\nLO QUE EL USUARIO TE HA CONTADO EN ESTA SESIÓN:\n" + \
                         "\n".join(f"  - {line}" for line in memory_lines)

    summary_section = ""
    if memory.get("summary"):
        summary_section = f"\nRESUMEN DE LA CONVERSACIÓN HASTA AHORA:\n{memory['summary']}"

    return f"""Eres Havi, el asistente virtual de Hey Banco. Eres amigable, directo y proactivo.
Hablas en español mexicano informal pero profesional. Usas emojis ocasionalmente.

PERFIL DEL USUARIO (detectado por el sistema):
- Arquetipo: {profile['archetype_name']}
- Características: {', '.join(profile['top_features']).replace('_', ' ')}
- Score de comportamiento inusual: {profile['anomaly_score']} (0=normal, 1=muy inusual)

RAZÓN POR LA QUE INICIASTE ESTA CONVERSACIÓN:
- Trigger: {t['name']} ({t['trigger_id']})
- Mensaje inicial: "{t['opening_message']}"
{screen_ctx}
TRANSACCIONES RECIENTES DEL USUARIO:
{tx_lines}
{memory_section}
{summary_section}

INSTRUCCIONES:
- Usa el contexto acumulado para personalizar cada respuesta. Si el usuario mencionó
  una meta u objetivo, refiérete a ella cuando sea relevante.
- NO vuelvas a ofrecer algo que el usuario ya rechazó en esta sesión.
- Si el usuario corrigió información del perfil, usa la corrección, no el perfil original.
- Si detectas que el usuario quiere navegar a otra pantalla, incluye al final de tu
  respuesta el token: [NAV:{{"screen":"nombre","label":"texto del botón"}}]
  Pantallas disponibles: inicio, pagos, transferir, buzon, salud, estado, cards, ajustes
- Respuestas cortas: máximo 3-4 oraciones. El usuario está en su teléfono.
- SOLO texto plano. Sin markdown, sin asteriscos, sin listas con guiones."""


# ── Función principal ────────────────────────────────────────────────────────

def get_chat_reply(
    user_id: str,
    session_id: str,
    message: str,
    current_screen: str = "inicio",
) -> tuple[str, dict | None]:
    """
    Procesa un turno de conversación con Havi.

    Retorna: (reply_text, navigation_action | None)
    navigation_action tiene forma: {"screen": "pagos", "label": "Ir a Pagos"}
    """
    profile = get_profile(user_id)
    if not profile:
        return ("Lo siento, no pude encontrar tu información. Intenta cerrar sesión y volver a entrar.", None)

    # Inicializar sesión y memoria si son nuevas
    _init_session(session_id, user_id, current_screen)

    memory = _user_memory[session_id]
    memory["turn_count"] += 1

    # Actualizar pantalla activa y registro de pantallas visitadas
    memory["current_screen"] = current_screen
    if current_screen not in memory["screens_visited"]:
        memory["screens_visited"].append(current_screen)

    # Agregar mensaje del usuario al historial
    _sessions[session_id].append({"role": "user", "content": message})

    # ── Extracción de memoria (cada MEMORY_EXTRACT_EVERY turnos) ──────────────
    if memory["turn_count"] % MEMORY_EXTRACT_EVERY == 0:
        update = _extract_memory_update(message, memory, profile)
        _apply_memory_update(memory, update)

    # ── Regenerar resumen (cada SUMMARY_EVERY turnos) ─────────────────────────
    if memory["turn_count"] % SUMMARY_EVERY == 0 and memory["turn_count"] > 0:
        memory["summary"] = _regenerate_summary(
            memory, _sessions[session_id], profile
        )

    # ── Llamada principal a Claude ────────────────────────────────────────────
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        system=_build_system_prompt(profile, memory, current_screen),
        messages=_sessions[session_id],
    )

    raw_reply = response.content[0].text

    # ── Extraer navigation_action si está presente ────────────────────────────
    nav_action = None
    nav_match = re.search(r'\[NAV:(\{.*?\})\]', raw_reply)
    if nav_match:
        try:
            nav_action = json.loads(nav_match.group(1))
            raw_reply  = raw_reply[:nav_match.start()].strip()
        except Exception:
            pass

    # Agregar respuesta al historial
    _sessions[session_id].append({"role": "assistant", "content": raw_reply})

    # ── Extracción inmediata para CTAs aceptados/rechazados ───────────────────
    # No esperar el ciclo de MEMORY_EXTRACT_EVERY para estos casos críticos
    msg_lower = message.lower()
    t = profile["trigger_active"]
    ctas_lower = [c.lower() for c in t.get("ctas", [])]

    for cta in ctas_lower:
        if cta in msg_lower and cta != "ahora no":
            if cta not in memory["decisions"]["accepted_ctas"]:
                memory["decisions"]["accepted_ctas"].append(cta)
        if ("ahora no" in msg_lower or "no gracias" in msg_lower or "no me interesa" in msg_lower):
            if "rechazo general" not in memory["decisions"]["rejected_ctas"]:
                memory["decisions"]["rejected_ctas"].append("rechazo general en turno " + str(memory["turn_count"]))

    # ── Truncar historial (ventana deslizante) ────────────────────────────────
    # Se trunca DESPUÉS de extraer la memoria, por lo que los datos importantes
    # ya están guardados en _user_memory antes de desaparecer del historial.
    if len(_sessions[session_id]) > MAX_HISTORY_MESSAGES:
        _sessions[session_id] = _sessions[session_id][-MAX_HISTORY_MESSAGES:]

    return (raw_reply, nav_action)


# ── Utilidades ───────────────────────────────────────────────────────────────

def get_session_memory(session_id: str) -> dict | None:
    """Retorna la memoria acumulada de una sesión. Útil para debugging y tests."""
    return _user_memory.get(session_id)


def clear_session(session_id: str) -> None:
    """Limpia historial y memoria de una sesión."""
    _sessions.pop(session_id, None)
    _user_memory.pop(session_id, None)
```

---

### Archivo: `api/schemas/models.py` — actualizar ChatMessageRequest y ChatMessageResponse

```python
# Agregar current_screen a ChatMessageRequest (si no está ya de Fase 3):
class ChatMessageRequest(BaseModel):
    user_id:        str
    session_id:     str
    message:        str
    current_screen: str = "inicio"   # default para backward compat


# Agregar NavigationAction y actualizar ChatMessageResponse:
class NavigationAction(BaseModel):
    screen: str
    label:  str

class ChatMessageResponse(BaseModel):
    reply:             str
    session_id:        str
    navigation_action: NavigationAction | None = None
```

---

### Archivo: `api/routers/chat.py` — actualizar el endpoint

```python
@router.post("/message", response_model=ChatMessageResponse)
def chat_message(
    req: ChatMessageRequest,
    authorization: str | None = Header(None),
):
    _resolve_token(authorization)
    reply, nav_action = get_chat_reply(
        req.user_id,
        req.session_id,
        req.message,
        req.current_screen,
    )
    return ChatMessageResponse(
        reply=reply,
        session_id=req.session_id,
        navigation_action=nav_action,
    )


# Endpoint nuevo para debugging — ver el estado de la memoria de una sesión:
@router.get("/session/{session_id}/memory")
def get_memory(session_id: str, authorization: str | None = Header(None)):
    """Retorna la memoria acumulada de una sesión. Solo para desarrollo."""
    _resolve_token(authorization)
    from api.services.chat_service import get_session_memory
    memory = get_session_memory(session_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return memory
```

---

## Cómo fluye la información ahora

```
Turno 1:
  Usuario: "quiero ahorrar para comprar un carro en 18 meses"
  → Extracción (turn 4 aún no): se guarda en historial
  → System prompt: solo perfil ML (memoria vacía)
  → Havi responde

Turno 4:
  Usuario: "prefiero no pedir crédito, tengo malas experiencias"
  → Extracción SE ACTIVA (turn_count % 4 == 0)
  → Claude Haiku extrae:
      metas: ["ahorrar para carro en 18 meses"]
      preferencias: ["no quiere crédito, malas experiencias"]
  → _apply_memory_update guarda esos datos en _user_memory
  → System prompt YA incluye: "Metas que mencionó: ahorrar para carro..."
  → Havi responde con ese contexto

Turno 8:
  → Resumen SE REGENERA (turn_count % 8 == 0)
  → "El usuario quiere ahorrar para un carro en 18 meses.
     Rechazó la opción de crédito. Exploró Hey Inversiones."
  → Este resumen se inyecta en todos los system prompts siguientes

Turno 24:
  → Historial se trunca a los últimos 12 mensajes
  → Pero la memoria y el resumen NO se truncan
  → Havi sigue sabiendo de la meta del carro y la aversión al crédito
```

---

## Configuración y parámetros tuneables

```python
# En chat_service.py, al inicio del archivo:

MAX_HISTORY_MESSAGES = 12   # ventana de mensajes en el historial
                            # más alto = más contexto reciente, más tokens
                            # más bajo = más rápido, menos costo

MEMORY_EXTRACT_EVERY = 4    # cada cuántos turnos extraer memoria
                            # más bajo = memoria más fresca, más llamadas a Haiku
                            # más alto = memoria puede estar desactualizada

SUMMARY_EVERY = 8           # cada cuántos turnos regenerar el resumen
                            # para sesiones cortas del hackathon, 8 está bien
```

**Para el hackathon (sesiones de 5–15 turnos típicamente):**
Los valores por defecto están bien. La extracción solo se activa en los turnos 4, 8, 12...
y el resumen en el 8, 16... Para demos cortos de 5–7 turnos, la memoria se extrae
una vez (turno 4) y es suficiente.

**Para producción real:**
Bajar `MEMORY_EXTRACT_EVERY` a 2 y usar un modelo de extracción más pequeño.
Considerar persistir `_user_memory` en Redis o SQLite entre sesiones del mismo usuario.

---

## Qué hace Haiku vs Sonnet en este diseño

| Tarea | Modelo | Justificación |
|-------|--------|---------------|
| Respuesta principal de Havi | claude-sonnet-4-6 | Calidad alta, personalidad, contexto complejo |
| Extracción de memoria | claude-haiku-4-5-20251001 | Tarea estructurada simple, JSON, velocidad importa |
| Regeneración de resumen | claude-haiku-4-5-20251001 | Resumen factual, no creativo |

La extracción de memoria y el resumen son tareas estructuradas que no requieren
el razonamiento de Sonnet. Haiku es ~5x más rápido y ~10x más barato para estas tareas.
La latencia del turno principal no se ve afectada porque la extracción ocurre
en el mismo request pero en llamadas rápidas.

---

## Endpoint de debugging: GET /chat/session/:id/memory

Este endpoint es solo para desarrollo. Permite ver en tiempo real qué está
acumulando Havi sobre el usuario durante la sesión.

```bash
curl http://localhost:8000/chat/session/TU-SESSION-ID/memory \
  -H "Authorization: Bearer VVNSLTAwMDQy" | python3 -m json.tool
```

Respuesta típica después de 6 turnos:
```json
{
  "session_id": "uuid-...",
  "user_id": "USR-00042",
  "turn_count": 6,
  "user_stated": {
    "metas": ["ahorrar para un carro en 18 meses"],
    "preocupaciones": [],
    "preferencias": ["no quiere crédito", "prefiere inversión conservadora"],
    "contexto_personal": ["tiene nómina domiciliada"],
    "correcciones": ["el cargo de Netflix no es suyo, es de su pareja"]
  },
  "decisions": {
    "accepted_ctas": ["ver inversión hey"],
    "rejected_ctas": ["simular crédito"],
    "topics_explored": ["Hey Inversiones", "alertas de saldo"],
    "actions_taken": ["solicitó simulación de rendimiento a 18 meses"]
  },
  "screens_visited": ["inicio", "salud"],
  "current_screen": "salud",
  "summary": "El usuario quiere ahorrar para un carro en 18 meses y prefiere no usar crédito. Exploró Hey Inversiones y le interesó la simulación de rendimiento."
}
```

---

## Checklist de implementación

```
[ ] chat_service.py reemplazado con la versión completa de este documento
[ ] _sessions y _user_memory declarados como dicts separados
[ ] _init_session() inicializa ambas estructuras
[ ] _extract_memory_update() llama a claude-haiku correctamente
[ ] _apply_memory_update() no duplica items ya existentes
[ ] _regenerate_summary() genera texto coherente
[ ] _build_system_prompt() incluye las 5 secciones: perfil, screen, transacciones, memoria, resumen
[ ] get_chat_reply() retorna tuple (str, dict | None)
[ ] Truncado ocurre DESPUÉS de la extracción de memoria
[ ] schemas/models.py tiene ChatMessageRequest con current_screen
[ ] schemas/models.py tiene NavigationAction y ChatMessageResponse actualizado
[ ] routers/chat.py desempaqueta (reply, nav_action) del tuple
[ ] GET /chat/session/:id/memory responde con la memoria actual
[ ] Backward compat: mensajes sin current_screen usan default "inicio"
```

---

## Verificación rápida post-implementación

```bash
# 1. Sesión de 5 turnos con información personal

SESSION="test-memory-$(date +%s)"
TOKEN="VVNSLTAwMDQy"
HDR="-H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN'"

# Turno 1 — información personal
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_id\":\"USR-00042\",\"session_id\":\"$SESSION\",\"message\":\"quiero ahorrar para el enganche de una casa, tengo 2 hijos\",\"current_screen\":\"inicio\"}" \
  | python3 -c "import sys,json; print('T1:', json.load(sys.stdin)['reply'][:80])"

# Turno 2 — preferencia negativa
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_id\":\"USR-00042\",\"session_id\":\"$SESSION\",\"message\":\"prefiero no pedir crédito, ya tuve problemas antes\",\"current_screen\":\"inicio\"}" \
  | python3 -c "import sys,json; print('T2:', json.load(sys.stdin)['reply'][:80])"

# Turnos 3 y 4 (para activar la extracción de memoria)
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_id\":\"USR-00042\",\"session_id\":\"$SESSION\",\"message\":\"¿cuánto necesito ahorrar por mes?\",\"current_screen\":\"salud\"}" \
  | python3 -c "import sys,json; print('T3:', json.load(sys.stdin)['reply'][:80])"

curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_id\":\"USR-00042\",\"session_id\":\"$SESSION\",\"message\":\"ok gracias\",\"current_screen\":\"salud\"}" \
  | python3 -c "import sys,json; print('T4:', json.load(sys.stdin)['reply'][:80])"

# 2. Ver qué extrajo la memoria después del turno 4
echo ""
echo "=== MEMORIA ACUMULADA ==="
curl -s "http://localhost:8000/chat/session/$SESSION/memory" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('Turno:', d['turn_count'])
print('Metas:', d['user_stated']['metas'])
print('Preferencias:', d['user_stated']['preferencias'])
print('Contexto personal:', d['user_stated']['contexto_personal'])
print('Temas explorados:', d['decisions']['topics_explored'])
"

# 3. Turno 5 — verificar que Havi usa la memoria (no ofrece crédito)
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_id\":\"USR-00042\",\"session_id\":\"$SESSION\",\"message\":\"¿qué opciones tengo para llegar a mi meta?\",\"current_screen\":\"salud\"}" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
reply=d['reply'].lower()
print('T5:', d['reply'][:150])
print()
if 'crédito' in reply or 'prestamo' in reply or 'préstamo' in reply:
    print('⚠  HAVI mencionó crédito — debería haberlo evitado por la preferencia registrada')
else:
    print('✓  HAVI no mencionó crédito — respetó la preferencia del usuario')
if 'casa' in reply or 'enganche' in reply or 'ahorro' in reply:
    print('✓  HAVI recordó la meta de la casa')
else:
    print('~  HAVI no mencionó la meta — verificar si la memoria se extrajo')
"
```
