from pydantic import BaseModel


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    user_id: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user_id: str


# ── User profile ──────────────────────────────────────────────────────────────

class Transaction(BaseModel):
    fecha: str
    comercio: str
    monto: float
    categoria: str
    tipo: str
    estatus: str | None = None
    motivo: str | None = None


class TriggerActive(BaseModel):
    trigger_id: str
    name: str
    opening_message: str
    ctas: list[str]


class UserProfile(BaseModel):
    user_id: str
    full_name: str | None = "Cliente Hey"  # Opcional para evitar 500s
    email: str | None = "cliente@hey.inc"   # Opcional para evitar 500s
    archetype_name: str
    cluster_id: int
    anomaly_score: float
    top_features: list[str]
    recent_transactions: list[Transaction]
    trigger_active: TriggerActive


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatOpenResponse(BaseModel):
    trigger_id: str
    opening_message: str
    ctas: list[str]
    archetype_name: str


class ChatMessageRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    current_screen: str = "inicio"


class NavigationAction(BaseModel):
    screen: str
    label: str


class ChatMessageResponse(BaseModel):
    reply: str
    session_id: str
    navigation_action: NavigationAction | None = None
