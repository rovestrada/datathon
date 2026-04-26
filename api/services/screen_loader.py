import json
from pathlib import Path

# Cache en memoria: { "USR-00042_home": {...} }
_screen_data: dict[str, dict] = {}

_API_SCREEN_DIR = Path(__file__).parent.parent / "mock" / "screen_data"
_LEGACY_SCREEN_DIR = Path(__file__).parent.parent.parent / "mock" / "screen_data"

# El frontend envía nombres en español; los JSONs usan inglés.
_SCREEN_NAME_MAP = {
    'inicio':     'home',
    'salud':      'health',
    'estado':     'statement',
    'pagos':      'payments',
    'buzon':      'inbox',
    'transferir': 'transfer',
    'cards':      'cards',
    'profile':    'profile',
    'havi':       'havi',
}


def _normalize(screen_id: str) -> str:
    return _SCREEN_NAME_MAP.get(screen_id, screen_id)


def _default_screen_dir() -> Path:
    if _API_SCREEN_DIR.exists():
        return _API_SCREEN_DIR
    return _LEGACY_SCREEN_DIR


def load_screen_data(directory: str | None = None) -> None:
    """Carga todos los JSONs de datos de pantalla."""
    global _screen_data
    _screen_data = {}
    p = Path(directory) if directory else _default_screen_dir()
    if not p.exists():
        print(f"[screen_loader] Directorio {p} no existe — usando datos vacíos")
        return

    for f in p.glob("*.json"):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            key = f"{d['user_id']}_{d['screen_id']}"
            _screen_data[key] = d
        except Exception as e:
            print(f"[screen_loader] Error leyendo {f.name}: {e}")

    print(f"[screen_loader] {len(_screen_data)} estados de pantalla cargados")


def get_screen_data(user_id: str, screen_id: str) -> dict | None:
    return _screen_data.get(f"{user_id}_{_normalize(screen_id)}")


def get_havi_context(user_id: str, screen_id: str) -> str:
    """Retorna el havi_context para inyectar en el system prompt."""
    d = get_screen_data(user_id, screen_id)
    if d:
        return d.get("havi_context", "")
    return f"El usuario está navegando en la sección {screen_id}."
