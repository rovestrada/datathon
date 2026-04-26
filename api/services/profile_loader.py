import base64
import json
import os
from pathlib import Path

# Índice en memoria: { user_id: dict }
_profiles: dict[str, dict] = {}

# Path del JSON relativo al paquete api/ (funciona desde cualquier CWD).
_API_MOCK_PATH = Path(__file__).parent.parent / "mock" / "user_profiles.json"
_LEGACY_MOCK_PATH = Path(__file__).parent.parent.parent / "mock" / "user_profiles.json"


def _default_profiles_path() -> Path:
    if _API_MOCK_PATH.exists():
        return _API_MOCK_PATH
    return _LEGACY_MOCK_PATH


def load_profiles(path: str | None = None) -> None:
    """Carga (o recarga) los perfiles. Soporta USER_PROFILES_B64 para Railway."""
    global _profiles
    b64 = os.getenv("USER_PROFILES_B64")
    if b64:
        data: list[dict] = json.loads(base64.b64decode(b64).decode("utf-8"))
        print(f"[loader] {len(data)} perfiles cargados desde USER_PROFILES_B64")
    else:
        p = Path(path) if path else _default_profiles_path()
        data = json.loads(p.read_text(encoding="utf-8"))
        print(f"[loader] {len(data)} perfiles cargados desde '{p}'")
    _profiles = {u["user_id"]: u for u in data}


def get_profile(user_id: str) -> dict | None:
    return _profiles.get(user_id)


def all_user_ids() -> list[str]:
    return list(_profiles.keys())


def validate_login(user_id: str, password: str) -> bool:
    profile = _profiles.get(user_id)
    if not profile:
        return False
    return profile.get("password") == password


def make_token(user_id: str) -> str:
    """Token = base64(user_id). Suficiente para el demo."""
    return base64.b64encode(user_id.encode()).decode()


def decode_token(token: str) -> str | None:
    """Decodifica el token. Retorna user_id o None si es inválido."""
    try:
        return base64.b64decode(token.encode()).decode()
    except Exception:
        return None
