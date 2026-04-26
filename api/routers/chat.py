from fastapi import APIRouter, HTTPException, Header, Query
from schemas.models import ChatOpenResponse, ChatMessageRequest, ChatMessageResponse
from services.profile_loader import get_profile, decode_token
from services.chat_service import get_chat_reply

router = APIRouter(prefix="/chat", tags=["chat"])


def _resolve_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ", 1)[1]
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    return user_id


@router.get("/open", response_model=ChatOpenResponse)
def chat_open(
    user_id: str = Query(..., description="ID del usuario"),
    authorization: str | None = Header(None),
):
    """
    Retorna el trigger activo del usuario: mensaje de apertura, CTAs y skin de la mascota.
    El frontend lo llama justo después del login para pre-cargar la experiencia proactiva.
    """
    _resolve_token(authorization)
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    t = profile["trigger_active"]
    return ChatOpenResponse(
        trigger_id=t["trigger_id"],
        opening_message=t["opening_message"],
        ctas=t["ctas"],
        archetype_name=profile["archetype_name"]
    )


@router.post("/message", response_model=ChatMessageResponse)
def chat_message(
    req: ChatMessageRequest,
    authorization: str | None = Header(None),
):
    """
    Turno de conversación con Havi. Mantiene historial por session_id en memoria.
    El system prompt incluye el perfil completo del usuario para que Havi tenga contexto.
    """
    _resolve_token(authorization)
    reply = get_chat_reply(req.user_id, req.session_id, req.message)
    return ChatMessageResponse(reply=reply, session_id=req.session_id)
