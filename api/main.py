from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import auth, users, chat
from services.profile_loader import load_profiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_profiles()
    yield


app = FastAPI(
    title="Havi API",
    version="0.1.0",
    description="Motor de inteligencia proactiva para Hey Banco.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chat.router)


@app.get("/health", tags=["infra"])
def health():
    return {"status": "ok"}


@app.post("/admin/reload", tags=["infra"])
def reload_profiles():
    """Recarga user_profiles.json sin reiniciar. Útil cuando DS actualiza el modelo."""
    load_profiles()
    return {"status": "reloaded"}
