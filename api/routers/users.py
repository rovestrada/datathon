from fastapi import APIRouter, HTTPException, Header
from schemas.models import UserProfile
from services.profile_loader import get_profile, decode_token

router = APIRouter(prefix="/user", tags=["users"])


def _resolve_token(authorization: str | None) -> str:
    """Valida el header Authorization y retorna el user_id del token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ", 1)[1]
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    return user_id


@router.get("/profile/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: str, authorization: str | None = Header(None)):
    _resolve_token(authorization)  # solo verifica que haya token válido
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return profile
