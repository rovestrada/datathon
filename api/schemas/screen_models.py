from pydantic import BaseModel
from typing import Any

class ScreenData(BaseModel):
    screen_id: str
    user_id:   str
    havi_context: str          # Texto descriptivo para el LLM
    data:      dict[str, Any]  # Datos crudos para la UI
