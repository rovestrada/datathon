import os
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
    # En Railway, los perfiles están un nivel arriba de 'api/' si el Root es 'api'
    # o en '../mock' si arrancamos desde 'api/'
    load_profiles()
    load_screen_data()
    yield


app = FastAPI(
    title="Havi API",
    version="0.1.0",
    description="Motor de inteligencia proactiva para Hey Banco.",
    lifespan=lifespan,
)

# Orígenes permitidos: leer de variable de entorno en producción
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chat.router)
app.include_router(screens.router)


@app.get("/")
def read_root():
    return {"status": "Havi API is running"}


@app.get("/health")
def health():
    return {"status": "ok", "environment": os.getenv("RAILWAY_ENVIRONMENT", "local")}
