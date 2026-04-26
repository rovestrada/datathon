import base64
import json
from pathlib import Path

# Índice en memoria: { user_id: dict }
_profiles: dict[str, dict] = {}


def load_profiles(path: str = "../mock/user_profiles.json") -> None:
    """Carga (o recarga) los perfiles desde el JSON. Llámala al arrancar y en /admin/reload."""
    global _profiles
    raw = Path(path).read_text(encoding="utf-8")
    data: list[dict] = json.loads(raw)
    _profiles = {u["user_id"]: u for u in data}
    print(f"[loader] {len(_profiles)} perfiles cargados desde '{path}'")


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
