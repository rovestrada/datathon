import json
import re
from datetime import datetime
from anthropic import Anthropic
from services.profile_loader import get_profile
from services.screen_loader import get_screen_data, get_havi_context

client = Anthropic()

# ── Storage ──────────────────────────────────────────────────────────────────
_sessions:    dict[str, list[dict]] = {}
_user_memory: dict[str, dict]       = {}

MAX_HISTORY_MESSAGES = 12
MEMORY_EXTRACT_EVERY = 4
SUMMARY_EVERY        = 8


# ── Session initialization ───────────────────────────────────────────────────

def _init_session(session_id: str, user_id: str, current_screen: str = "inicio") -> None:
    if session_id not in _sessions:
        _sessions[session_id] = []
    if session_id not in _user_memory:
        _user_memory[session_id] = {
            "session_id":   session_id,
            "user_id":      user_id,
            "created_at":   datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat(),
            "turn_count":   0,
            "user_stated": {
                "metas":             [],
                "preocupaciones":    [],
                "preferencias":      [],
                "contexto_personal": [],
                "correcciones":      [],
            },
            "decisions": {
                "accepted_ctas":   [],
                "rejected_ctas":   [],
                "topics_explored": [],
                "actions_taken":   [],
            },
            "screens_visited":  [current_screen],
            "screen_snapshots": {},   # { screen_id: { key fields vistas por el usuario } }
            "current_screen":   current_screen,
            "summary":          "",
        }


# ── Screen snapshot (memoria cross-screen) ───────────────────────────────────

def _build_screen_snapshot(screen_id: str, data: dict) -> dict:
    """Extrae los campos numéricos clave de una pantalla para recordarlos entre navegaciones."""
    snap = {}
    try:
        if screen_id == "home":
            if data.get("saldo_disponible") is not None:
                snap["saldo"] = f"${data['saldo_disponible']:,.0f}"
            if data.get("cashback_acumulado"):
                snap["cashback"] = f"${data['cashback_acumulado']:,.0f}"

        elif screen_id == "health":
            if data.get("score_financiero") is not None:
                snap["score"] = f"{data['score_financiero']}/100"
            if data.get("utilizacion_credito_pct") is not None:
                snap["utilizacion_credito"] = f"{data['utilizacion_credito_pct'] * 100:.0f}%"
            if data.get("ahorro_potencial_mensual"):
                snap["ahorro_potencial"] = f"${data['ahorro_potencial_mensual']:,.0f}/mes"

        elif screen_id == "cards":
            tarjetas = data.get("tarjetas_credito", data.get("tarjetas", []))
            if tarjetas:
                t = tarjetas[0]
                snap["limite"]     = f"${t.get('limite', 0):,.0f}"
                snap["disponible"] = f"${t.get('disponible', 0):,.0f}"
                if t.get("fecha_pago"):
                    snap["fecha_pago"] = t["fecha_pago"]

        elif screen_id == "payments":
            servicios = data.get("servicios_frecuentes", data.get("servicios_guardados", []))
            proximos  = [s for s in servicios if s.get("dias_para_vencimiento") is not None]
            if proximos:
                p = proximos[0]
                snap["proximo_vencimiento"] = (
                    f"{p['nombre']} ${p.get('monto_ultimo', 0):.0f} "
                    f"en {p['dias_para_vencimiento']} días"
                )

        elif screen_id == "transfer":
            if data.get("saldo_disponible") is not None:
                snap["saldo"] = f"${data['saldo_disponible']:,.0f}"

        elif screen_id == "profile":
            if data.get("score_buro"):
                snap["score_buro"] = str(data["score_buro"])
            snap["hey_pro"] = "activo" if data.get("es_hey_pro") else "inactivo"

        elif screen_id == "inbox":
            no_leidas = data.get("no_leidas", 0)
            if no_leidas:
                snap["notif_no_leidas"] = str(no_leidas)

    except Exception:
        pass

    return {k: v for k, v in snap.items() if v is not None}


# ── Structured screen context ────────────────────────────────────────────────

def _build_structured_screen_context(user_id: str, screen_id: str) -> str:
    """Combina havi_context con los campos estructurados más relevantes del screen data."""
    d = get_screen_data(user_id, screen_id)
    if not d:
        return f"El usuario está en la sección {screen_id}."

    base = d.get("havi_context", "")
    data = d.get("data", {})
    lines = [base] if base else []

    try:
        if screen_id == "home":
            saldo   = data.get("saldo_disponible")
            cashback = data.get("cashback_acumulado")
            if saldo is not None:
                lines.append(f"Saldo disponible exacto: ${saldo:,.2f} MXN")
            if cashback:
                lines.append(f"Cashback acumulado: ${cashback:,.2f}")
            movs = data.get("movimientos_recientes", [])[:3]
            if movs:
                lines.append("Últimos movimientos: " + "; ".join(
                    f"{m['comercio']} ${abs(m['monto']):.0f}" for m in movs
                ))

        elif screen_id == "health":
            score  = data.get("score_financiero")
            util   = data.get("utilizacion_credito_pct")
            ahorro = data.get("ahorro_potencial_mensual")
            if score is not None:
                lines.append(f"Score financiero: {score}/100 ({data.get('score_label', '')})")
            if util is not None:
                lines.append(f"Utilización de crédito: {util * 100:.1f}%")
            if ahorro:
                lines.append(f"Ahorro potencial mensual identificado: ${ahorro:,.2f}")
            dist = data.get("distribucion_gastos", [])[:3]
            if dist:
                lines.append("Top categorías de gasto: " + "; ".join(
                    f"{g['categoria']} {g['pct'] * 100:.0f}% (${g['monto']:,.0f})"
                    for g in dist
                ))
            consejos = data.get("consejos", [])[:2]
            if consejos:
                lines.append("Consejos activos del sistema: " + "; ".join(consejos))

        elif screen_id == "cards":
            tarjetas = data.get("tarjetas_credito", data.get("tarjetas", []))
            if tarjetas:
                t = tarjetas[0]
                lines.append(
                    f"Tarjeta {t.get('label', '')}: "
                    f"límite ${t.get('limite', 0):,.0f}, "
                    f"disponible ${t.get('disponible', 0):,.0f} "
                    f"({t.get('utilizacion_pct', 0) * 100:.0f}% utilizado). "
                    f"Corte: {t.get('fecha_corte', 'N/A')}. "
                    f"Pago: {t.get('fecha_pago', 'N/A')}. "
                    f"Pago mínimo: ${t.get('pago_minimo', 0):,.2f}."
                )
            debito = data.get("cuenta_debito")
            if debito and debito.get("saldo") is not None:
                lines.append(f"Cuenta débito: ${debito['saldo']:,.2f}")

        elif screen_id == "payments":
            servicios = data.get("servicios_frecuentes", data.get("servicios_guardados", []))[:4]
            if servicios:
                lines.append("Servicios: " + "; ".join(
                    f"{s['nombre']} ${s.get('monto_ultimo', 0):.0f}"
                    + (f" (vence en {s['dias_para_vencimiento']} días)"
                       if s.get("dias_para_vencimiento") is not None else "")
                    for s in servicios
                ))
            rechazado = data.get("pago_rechazado_reciente")
            if rechazado:
                lines.append(f"⚠ Pago rechazado reciente detectado: {rechazado}")

        elif screen_id == "transfer":
            saldo  = data.get("saldo_disponible")
            limite = data.get("limite_diario")
            if saldo is not None:
                lines.append(f"Saldo disponible para transferir: ${saldo:,.2f}")
            if limite:
                lines.append(f"Límite diario de transferencia: ${limite:,.0f}")
            destinatarios = data.get("destinatarios_frecuentes", [])[:2]
            if destinatarios:
                lines.append("Destinatarios frecuentes: " + ", ".join(
                    f"{dest['alias']} (${dest.get('ultimo_monto', 0):.0f} hace {dest.get('hace_dias', 0)} días)"
                    for dest in destinatarios
                ))

        elif screen_id == "inbox":
            no_leidas = data.get("no_leidas", 0)
            notifs    = data.get("notificaciones", [])
            if no_leidas:
                lines.append(f"{no_leidas} notificación(es) sin leer.")
            urgentes = [n for n in notifs if not n.get("leida")]
            if urgentes:
                lines.append("Pendientes: " + "; ".join(
                    n.get("titulo", "") for n in urgentes[:2]
                ))

        elif screen_id == "profile":
            score_buro = data.get("score_buro")
            hey_pro    = data.get("es_hey_pro")
            nomina     = data.get("nomina_domiciliada")
            productos  = data.get("productos_activos")
            if score_buro:
                lines.append(f"Score buró: {score_buro}")
            if hey_pro is not None:
                lines.append(f"Hey Pro: {'activo' if hey_pro else 'inactivo'}")
            if nomina is not None:
                lines.append(f"Nómina domiciliada: {'sí' if nomina else 'no'}")
            if productos:
                lines.append(f"Productos activos: {productos}")

    except Exception:
        pass

    return "\n".join(lines)


# ── Memory extraction (Claude Haiku) ─────────────────────────────────────────

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
- preocupaciones: miedos o problemas financieros
- preferencias: lo que le gusta o no le gusta hacer con su dinero
- contexto_personal: datos personales relevantes (familia, trabajo, ingresos, situación)
- correcciones: cuando el usuario desmiente algo del perfil ("ese cargo no es mío")
- accepted_ctas: si aceptó explícitamente una oferta de HAVI
- rejected_ctas: si rechazó explícitamente algo ("no gracias", "ahora no")
- topics_explored: temas sobre los que preguntó (inversión, crédito, cashback, etc.)
- actions_taken: acciones concretas solicitadas ("quiero activar X", "simula Y")
Solo strings cortos (máximo 80 chars cada uno). Sin duplicar lo que ya está en memoria."""


def _extract_memory_update(user_message: str, existing_memory: dict, profile: dict) -> dict:
    """Llama a Claude Haiku para extraer info nueva del mensaje del usuario."""
    stated = existing_memory["user_stated"]
    existing_summary = json.dumps({
        "metas":        stated["metas"][-3:],
        "preferencias": stated["preferencias"][-3:],
        "contexto":     stated["contexto_personal"][-3:],
    }, ensure_ascii=False)

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            system=_EXTRACT_SYSTEM,
            messages=[{
                "role": "user",
                "content": (
                    f"Perfil base: arquetipo={profile.get('archetype_name', '')}, "
                    f"features={', '.join(profile.get('top_features', []))}\n\n"
                    f"Lo que ya sé del usuario: {existing_summary}\n\n"
                    f"Nuevo mensaje del usuario: \"{user_message}\"\n\n"
                    "Extrae SOLO información nueva que no esté ya registrada."
                ),
            }],
        )
        raw = response.content[0].text.strip()
        raw = re.sub(r"^```json\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        return json.loads(raw)
    except Exception:
        return {}


def _apply_memory_update(memory: dict, update: dict) -> None:
    if not update:
        return
    stated    = memory["user_stated"]
    decisions = memory["decisions"]

    for key in ("metas", "preocupaciones", "preferencias", "contexto_personal", "correcciones"):
        for item in update.get(key, []):
            if isinstance(item, str) and item.strip() and item not in stated[key]:
                stated[key].append(item.strip())

    for key in ("accepted_ctas", "rejected_ctas", "topics_explored", "actions_taken"):
        for item in update.get(key, []):
            if isinstance(item, str) and item.strip() and item not in decisions[key]:
                decisions[key].append(item.strip())

    memory["last_updated"] = datetime.utcnow().isoformat()


# ── Session summary (Claude Haiku) ───────────────────────────────────────────

_SUMMARY_SYSTEM = """Eres un resumidor de conversaciones bancarias.
Escribe un resumen factual y conciso (máximo 3 oraciones) de lo que ha pasado
en esta sesión de chat. Enfócate en: qué quería el usuario, qué decidió, y qué
información importante compartió. Responde SOLO con el texto del resumen, sin
encabezados ni formato."""


def _regenerate_summary(memory: dict, history: list[dict], profile: dict) -> str:
    stated    = memory["user_stated"]
    decisions = memory["decisions"]

    context = (
        f"Usuario: {profile.get('archetype_name', '')}. "
        f"Pantallas visitadas: {', '.join(memory['screens_visited'])}. "
        f"Temas explorados: {', '.join(decisions['topics_explored'])}. "
        f"Metas: {', '.join(stated['metas'])}. "
        f"CTAs rechazados: {', '.join(decisions['rejected_ctas'])}. "
        f"Contexto personal: {', '.join(stated['contexto_personal'])}."
    )
    recent = "\n".join(
        f"{m['role'].upper()}: {m['content'][:100]}" for m in history[-6:]
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            system=_SUMMARY_SYSTEM,
            messages=[{
                "role": "user",
                "content": f"Datos de la sesión:\n{context}\n\nÚltimos mensajes:\n{recent}",
            }],
        )
        return response.content[0].text.strip()
    except Exception:
        return ""


# ── System prompt (5 capas) ──────────────────────────────────────────────────

def _build_system_prompt(profile: dict, memory: dict, current_screen: str = "inicio") -> str:
    t   = profile["trigger_active"]
    txs = profile.get("recent_transactions", [])

    tx_lines = "\n".join(
        f"  - {tx['fecha']} | {tx['comercio']} | ${tx['monto']:.0f} MXN"
        f" | {tx['categoria']} | {tx['tipo']}"
        + (f" | ⚠ RECHAZADA: {tx.get('motivo', '')}" if tx.get("estatus") == "no_procesada" else "")
        for tx in txs
    )

    first_name = profile.get("full_name", "").split()[0] if profile.get("full_name") else None
    name_line  = (
        f"- Llama al usuario por su nombre de pila ({first_name}) de forma natural en la primera oración."
        if first_name else
        "- Llama al usuario de forma amigable."
    )

    # Capa 1: contexto enriquecido de la pantalla actual
    screen_ctx = _build_structured_screen_context(profile["user_id"], current_screen)

    # Capa 2: datos que el usuario vio en otras pantallas esta sesión
    cross_screen = ""
    snapshots = memory.get("screen_snapshots", {})
    snap_lines = [
        f"  {scr}: {', '.join(f'{k}={v}' for k, v in snap.items())}"
        for scr, snap in snapshots.items()
        if scr != current_screen and snap
    ]
    if snap_lines:
        cross_screen = (
            "\nDATOS QUE EL USUARIO VIO EN OTRAS PANTALLAS ESTA SESIÓN:\n"
            + "\n".join(snap_lines)
        )

    # Capa 3: memoria acumulada de la conversación
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
        memory_lines.append(f"Lo que rechazó (NO volver a ofrecer): {'; '.join(decisions['rejected_ctas'])}")
    if decisions["topics_explored"]:
        memory_lines.append(f"Temas explorados hoy: {'; '.join(decisions['topics_explored'])}")

    memory_section = ""
    if memory_lines:
        memory_section = (
            "\nLO QUE EL USUARIO TE HA CONTADO EN ESTA SESIÓN:\n"
            + "\n".join(f"  - {line}" for line in memory_lines)
        )

    # Capa 4: resumen narrativo (se activa en turno 8+)
    summary_section = ""
    if memory.get("summary"):
        summary_section = f"\nRESUMEN DE LA CONVERSACIÓN HASTA AHORA:\n{memory['summary']}"

    # Pantallas con contenido propio — screen context es la fuente primaria
    is_content_screen = current_screen not in ('inicio', 'havi', 'home', '')

    trigger_block = (
        f"RAZÓN POR LA QUE INICIASTE ESTA CONVERSACIÓN (contexto de fondo):\n"
        f"- Trigger: {t['name']} ({t['trigger_id']})\n"
        f"- Mensaje inicial: \"{t['opening_message']}\""
    )

    if is_content_screen:
        # Pantallas de contenido: screen data primero, trigger al final como contexto secundario
        body = f"""PANTALLA ACTUAL: {current_screen}
FUENTE PRIMARIA — DATOS DE LO QUE EL USUARIO ESTÁ VIENDO AHORA:
{screen_ctx}
{cross_screen}
TRANSACCIONES RECIENTES:
{tx_lines}
{memory_section}
{summary_section}

{trigger_block}"""
        data_source_instruction = (
            "- PRIORIDAD DE DATOS: Si el usuario pregunta sobre saldos, scores, tarjetas, pagos "
            "o cualquier dato específico, usa SIEMPRE la sección FUENTE PRIMARIA. "
            "El trigger es solo contexto de fondo — no lo menciones a menos que el usuario lo traiga."
        )
    else:
        # Pantalla de inicio o chat directo: trigger es relevante
        body = f"""RAZÓN POR LA QUE INICIASTE ESTA CONVERSACIÓN:
- Trigger: {t['name']} ({t['trigger_id']})
- Mensaje inicial que enviaste: "{t['opening_message']}"

PANTALLA ACTUAL: {current_screen}
CONTEXTO DE LO QUE EL USUARIO VE:
{screen_ctx}
{cross_screen}
TRANSACCIONES RECIENTES:
{tx_lines}
{memory_section}
{summary_section}"""
        data_source_instruction = (
            "- Puedes mencionar el trigger activo de forma proactiva si el usuario no ha preguntado "
            "nada específico aún. Si ya preguntó algo concreto, enfócate en eso."
        )

    return f"""Eres Havi, el asistente virtual de Hey Banco. Eres amigable, directo y proactivo.
Hablas en español mexicano informal pero profesional. Usas emojis ocasionalmente.

PERFIL DEL USUARIO (ML):
- Nombre: {profile.get('full_name', 'Cliente')}
- Arquetipo: {profile['archetype_name']}
- Características: {', '.join(profile['top_features']).replace('_', ' ')}
- Score de comportamiento inusual: {profile['anomaly_score']} (0=normal, 1=muy inusual)

{body}

INSTRUCCIONES:
{name_line}
{data_source_instruction}
- Usa el contexto acumulado para personalizar respuestas. Si el usuario mencionó una meta, refiérete a ella.
- NO vuelvas a ofrecer algo que el usuario ya rechazó en esta sesión.
- Si el usuario corrigió información del perfil, usa la corrección.
- NAVEGACIÓN — reglas estrictas:
  Incluye [NAV:{{"screen":"id","label":"texto"}}] SOLO si se cumplen LAS DOS condiciones:
  1. El usuario dice EXPLÍCITAMENTE que quiere ir a otra sección con palabras como
     "quiero ver", "llévame", "muéstrame", "ir a", "abre", "navegar", "ir a", "mostrar".
     Preguntar sobre un tema NO es suficiente — solo una solicitud directa de ir cuenta.
  2. La pantalla destino es DIFERENTE a la pantalla actual ({current_screen}).
  Si no se cumplen ambas condiciones, NO incluyas NAV. Omite el token completamente.
  El label debe ser específico: "Ver mis tarjetas", "Ir a Pagos", "Ver movimientos".
  Máximo 1 NAV por respuesta.
- Respuestas cortas: máximo 3-4 oraciones. El usuario está en su teléfono.
- SOLO texto plano antes del NAV. Sin markdown, sin asteriscos."""


# ── Main function ────────────────────────────────────────────────────────────

def get_chat_reply(
    user_id: str,
    session_id: str,
    message: str,
    current_screen: str = "inicio",
) -> tuple[str, dict | None]:
    profile = get_profile(user_id)
    if not profile:
        return ("Lo siento, no pude encontrar tu información. Intenta cerrar sesión y volver a entrar.", None)

    _init_session(session_id, user_id, current_screen)
    memory = _user_memory[session_id]
    memory["turn_count"] += 1

    # Actualizar pantalla activa y registro de navegación
    memory["current_screen"] = current_screen
    if current_screen not in memory["screens_visited"]:
        memory["screens_visited"].append(current_screen)

    # Capturar snapshot de la pantalla actual (una sola vez por pantalla por sesión)
    if current_screen not in memory["screen_snapshots"]:
        sd = get_screen_data(user_id, current_screen)
        if sd and sd.get("data"):
            snap = _build_screen_snapshot(current_screen, sd["data"])
            if snap:
                memory["screen_snapshots"][current_screen] = snap

    # Añadir mensaje del usuario al historial
    _sessions[session_id].append({"role": "user", "content": message})

    # Extracción de memoria (cada MEMORY_EXTRACT_EVERY turnos)
    if memory["turn_count"] % MEMORY_EXTRACT_EVERY == 0:
        update = _extract_memory_update(message, memory, profile)
        _apply_memory_update(memory, update)

    # Regenerar resumen narrativo (cada SUMMARY_EVERY turnos)
    if memory["turn_count"] % SUMMARY_EVERY == 0 and memory["turn_count"] > 0:
        memory["summary"] = _regenerate_summary(memory, _sessions[session_id], profile)

    # Tracking inmediato de CTAs del trigger (sin esperar el ciclo de extracción)
    msg_lower = message.lower()
    for cta in profile["trigger_active"].get("ctas", []):
        cta_lower = cta.lower()
        if cta_lower in msg_lower and cta_lower != "ahora no":
            if cta not in memory["decisions"]["accepted_ctas"]:
                memory["decisions"]["accepted_ctas"].append(cta)
    if any(p in msg_lower for p in ("ahora no", "no gracias", "no me interesa")):
        marker = f"rechazo en turno {memory['turn_count']}"
        if marker not in memory["decisions"]["rejected_ctas"]:
            memory["decisions"]["rejected_ctas"].append(marker)

    # Llamada principal a Claude Sonnet
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=450,
            system=_build_system_prompt(profile, memory, current_screen),
            messages=_sessions[session_id],
        )
    except Exception as e:
        print(f"[chat_service] Error Anthropic: {e}")
        return ("Havi está teniendo problemas técnicos en este momento. Intenta de nuevo.", None)

    raw_reply = response.content[0].text

    # Extraer navigation_action del token [NAV:{...}]
    nav_action = None
    nav_match  = re.search(r'\[NAV:(\{.*?\})\]', raw_reply)
    if nav_match:
        try:
            nav_action = json.loads(nav_match.group(1))
            raw_reply  = raw_reply[:nav_match.start()].strip()
        except Exception:
            pass

    # Añadir respuesta al historial
    _sessions[session_id].append({"role": "assistant", "content": raw_reply})

    # Ventana deslizante — truncar DESPUÉS de extraer la memoria
    if len(_sessions[session_id]) > MAX_HISTORY_MESSAGES:
        _sessions[session_id] = _sessions[session_id][-MAX_HISTORY_MESSAGES:]

    return (raw_reply, nav_action)


# ── Utilities ────────────────────────────────────────────────────────────────

def get_session_memory(session_id: str) -> dict | None:
    """Retorna la memoria acumulada de una sesión. Útil para debugging y el pitch."""
    return _user_memory.get(session_id)


def clear_session(session_id: str) -> None:
    _sessions.pop(session_id, None)
    _user_memory.pop(session_id, None)
