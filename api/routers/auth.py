from fastapi import APIRouter, HTTPException
from schemas.models import LoginRequest, LoginResponse
from services.profile_loader import validate_login, make_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    if not validate_login(req.user_id, req.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return LoginResponse(token=make_token(req.user_id), user_id=req.user_id)
