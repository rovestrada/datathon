import os
from anthropic import Anthropic
from services.profile_loader import get_profile

# Historial por sesión: { session_id: [{"role": ..., "content": ...}] }
_sessions: dict[str, list[dict]] = {}

MAX_HISTORY = 20  # mensajes máximos por sesión antes de truncar


def _build_system_prompt(profile: dict) -> str:
    t = profile["trigger_active"]
    txs = profile.get("recent_transactions", [])

    tx_lines = "\n".join(
        f"  - {tx['fecha']} | {tx['comercio']} | ${tx['monto']:.0f} MXN"
        f" | {tx['categoria']} | {tx['tipo']}"
        + (f" | ⚠ {tx.get('motivo', '')}" if tx.get("estatus") == "no_procesada" else "")
        for tx in txs
    )

    return f"""Eres Havi, el asistente virtual de Hey Banco. Tu personalidad es amigable,
directa y proactiva. Hablas en español mexicano informal pero profesional. Usas emojis
ocasionalmente pero sin exagerar.

PERFIL DEL USUARIO:
- Arquetipo: {profile['archetype_name']}
- Características detectadas: {', '.join(profile['top_features']).replace('_', ' ')}
- Score de comportamiento inusual: {profile['anomaly_score']} (0 = normal, 1 = muy inusual)

RAZÓN POR LA QUE INICIACHE ESTA CONVERSACIÓN (trigger activo):
- Tipo: {t['name']} ({t['trigger_id']})
- Mensaje que enviaste: "{t['opening_message']}"
- Opciones que ofreciste: {', '.join(t['ctas'])}

ÚLTIMAS TRANSACCIONES DEL USUARIO:
{tx_lines}

INSTRUCCIONES DE COMPORTAMIENTO:
- Si el usuario acepta un CTA, da detalles concretos y útiles del producto o acción.
- Si dice "Ahora no" o algo similar, despídete amablemente y ofrece ayuda futura.
- Solo habla de temas financieros y de productos Hey Banco. Si preguntan algo fuera
  de ese alcance, redirige amablemente.
- Nunca inventes cifras que no estén en el perfil. Si no tienes un dato, dilo.
- Mantén respuestas cortas: máximo 3-4 oraciones. El usuario está en su teléfono.
- Responde SOLO en texto plano. Sin markdown, sin listas con asteriscos, sin negritas."""


def get_chat_reply(user_id: str, session_id: str, message: str) -> str:
    profile = get_profile(user_id)
    if not profile:
        return "Lo siento, no pude encontrar tu información."

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return "Error: ANTHROPIC_API_KEY no configurada."

    try:
        client = Anthropic(api_key=api_key)

        if session_id not in _sessions:
            _sessions[session_id] = []

        _sessions[session_id].append({"role": "user", "content": message})

        # Usamos el modelo especificado para el hackathon
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system=_build_system_prompt(profile),
            messages=_sessions[session_id],
        )

        reply = response.content[0].text
        _sessions[session_id].append({"role": "assistant", "content": reply})

        if len(_sessions[session_id]) > MAX_HISTORY:
            _sessions[session_id] = _sessions[session_id][-MAX_HISTORY:]

        return reply
    except Exception as e:
        print(f"[chat_service] Error de Anthropic: {str(e)}")
        return f"Havi está teniendo problemas técnicos: {str(e)}"


def clear_session(session_id: str) -> None:
    _sessions.pop(session_id, None)
