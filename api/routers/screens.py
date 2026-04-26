from fastapi import APIRouter, HTTPException, Header, Query
from schemas.screen_models import ScreenData
from services.screen_loader import get_screen_data
from services.profile_loader import decode_token

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
        # Fallback si no hay mock específico
        return ScreenData(
            screen_id=screen_id,
            user_id=user_id,
            havi_context=f"El usuario está en la sección {screen_id}.",
            data={},
        )
    return data
