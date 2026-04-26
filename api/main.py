from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import auth, users, chat, screens
from services.profile_loader import load_profiles
from services.screen_loader import load_screen_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_profiles()
    load_screen_data()
    yield


app = FastAPI(
    title="Havi API",
    version="0.1.0",
    description="Motor de inteligencia proactiva para Hey Banco.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chat.router)
app.include_router(screens.router)


@app.get("/health", tags=["infra"])
def health():
    return {"status": "ok"}


@app.post("/admin/reload", tags=["infra"])
def reload_profiles():
    """Recarga perfiles y datos de pantalla sin reiniciar."""
    load_profiles()
    load_screen_data()
    return {"status": "reloaded"}
