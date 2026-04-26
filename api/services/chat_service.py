import os
import json
import re
from anthropic import Anthropic
from services.profile_loader import get_profile
from services.screen_loader import get_havi_context

# Historial por sesión: { session_id: [{"role": ..., "content": ...}] }
_sessions: dict[str, list[dict]] = {}

MAX_HISTORY = 20  


def _build_system_prompt(profile: dict, current_screen: str = "inicio") -> str:
    t = profile["trigger_active"]
    txs = profile.get("recent_transactions", [])
    
    # Obtener el contexto narrativo de la pantalla actual
    screen_ctx = get_havi_context(profile["user_id"], current_screen)

    tx_lines = "\n".join(
        f"  - {tx['fecha']} | {tx['comercio']} | ${tx['monto']:.0f} MXN"
        f" | {tx['categoria']} | {tx['tipo']}"
        + (f" | ⚠ {tx.get('motivo', '')}" if tx.get("estatus") == "no_procesada" else "")
        for tx in txs
    )

    return f"""Eres Havi, el asistente virtual de Hey Banco. Tu personalidad es amigable,
directa y proactiva. Hablas en español mexicano informal pero profesional.

PERFIL DEL USUARIO:
- Arquetipo: {profile['archetype_name']}
- Características detectadas: {', '.join(profile['top_features']).replace('_', ' ')}
- Score de comportamiento inusual: {profile['anomaly_score']}

PANTALLA ACTUAL DONDE ESTÁ EL USUARIO: {current_screen}
CONTEXTO DE LO QUE EL USUARIO ESTÁ VIENDO AHORA:
{screen_ctx}

RAZÓN DEL TRIGGER PROACTIVO (solo si es el inicio):
- Mensaje que enviaste: "{t['opening_message']}"
- Opciones que ofreciste: {', '.join(t['ctas'])}

ÚLTIMAS TRANSACCIONES:
{tx_lines}

INSTRUCCIONES DE COMPORTAMIENTO:
- Responde de forma contextual a la pantalla actual si es relevante.
- Si el usuario muestra interés en navegar a otra sección (ej: "ver mi tarjeta", "quiero pagar", "inicio"), incluye al final de tu respuesta el siguiente formato JSON:
  [NAV:{{"screen":"id_de_la_pantalla","label":"Texto corto del botón"}}]
  IDs permitidos: inicio, pagos, transferir, buzon, salud, estado, cards, ajustes, havi.
- Responde SOLO en texto plano (antes del tag NAV). Sin markdown.
- Respuestas cortas: 3-4 oraciones máximo.
"""


def get_chat_reply(user_id: str, session_id: str, message: str, 
                   current_screen: str = "inicio") -> tuple[str, dict | None]:
    profile = get_profile(user_id)
    if not profile:
        return ("Lo siento, no pude encontrar tu información.", None)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return ("Error: ANTHROPIC_API_KEY no configurada.", None)

    try:
        client = Anthropic(api_key=api_key)

        if session_id not in _sessions:
            _sessions[session_id] = []

        _sessions[session_id].append({"role": "user", "content": message})

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=450,
            system=_build_system_prompt(profile, current_screen),
            messages=_sessions[session_id],
        )

        full_reply = response.content[0].text
        
        # Extraer navigation_action si existe
        nav_action = None
        nav_match = re.search(r'\[NAV:(\{.*?\})\]', full_reply)
        reply_text = full_reply
        
        if nav_match:
            try:
                nav_action = json.loads(nav_match.group(1))
                reply_text = full_reply[:nav_match.start()].strip()
            except:
                pass

        _sessions[session_id].append({"role": "assistant", "content": reply_text})

        if len(_sessions[session_id]) > MAX_HISTORY:
            _sessions[session_id] = _sessions[session_id][-MAX_HISTORY:]

        return (reply_text, nav_action)
    except Exception as e:
        print(f"[chat_service] Error de Anthropic: {str(e)}")
        return (f"Havi está teniendo problemas técnicos: {str(e)}", None)


def clear_session(session_id: str) -> None:
    _sessions.pop(session_id, None)
