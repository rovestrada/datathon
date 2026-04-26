# CONTEXT.md — Havi Proactivo · Hey Banco Hackathon

> Este archivo es el punto de entrada para cualquier LLM de CLI que trabaje en este proyecto.
> Lee este archivo primero. Luego lee el CONTEXT de la fase específica que vayas a implementar.

---

## Qué es este proyecto

**"Havi que te conoce"** es una demo interactiva para el hackathon de Hey Banco (24 horas).
Simula la app móvil de Hey Banco con un asistente virtual llamado **Havi** que es proactivo:
en lugar de esperar a que el usuario pregunte, Havi abre la conversación con un mensaje
personalizado basado en los datos transaccionales y demográficos del usuario.

El factor diferenciador visual es una **mascota pixel-art** (assets de vscode-pets, licencia MIT)
que camina sobre la barra de navegación inferior. La mascota cambia de apariencia según el
tipo de alerta activa del usuario, y al hacer click en ella aparece un speech bubble con el
mensaje proactivo de Havi. Al hacer click en el speech bubble, se abre el chat completo.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite, React Router v6, CSS Modules o Tailwind, Axios |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| LLM | Claude API (`claude-sonnet-4-6`) via `anthropic` SDK |
| ML (equipo DS) | scikit-learn, sentence-transformers, pandas — entrega `user_profiles_final.json` |
| Assets mascota | GIFs de vscode-pets (MIT) copiados a `frontend/public/pets/` |
| Datos | Parquet + CSV locales (no hay base de datos en el hackathon) |

---

## Estructura del monorepo

```
.
├── CONTEXT.md                  ← este archivo
├── api_contract.md             ← contrato de endpoints (fuente de verdad)
├── mock/
│   └── user_profiles.json      ← perfiles mockeados (5–8 usuarios demo)
├── api/                        ← FastAPI backend
│   ├── main.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── chat.py
│   ├── services/
│   │   ├── profile_loader.py
│   │   ├── trigger_engine.py
│   │   └── chat_service.py
│   ├── schemas/
│   │   └── models.py
│   └── requirements.txt
├── frontend/                   ← React app
│   ├── public/
│   │   └── pets/               ← GIFs de vscode-pets organizados por skin
│   │       ├── cat_orange/     ← walk.gif, idle.gif, sit.gif
│   │       ├── cat_purple/
│   │       ├── cat_green/
│   │       └── cat_gray/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Home.jsx
│   │   ├── components/
│   │   │   ├── AppShell.jsx
│   │   │   ├── PetSprite.jsx
│   │   │   ├── SpeechBubble.jsx
│   │   │   ├── HaviChat.jsx
│   │   │   └── CTAButtons.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
└── context-phases/             ← un CONTEXT.md por fase para el LLM CLI
    ├── CONTEXT_PHASE_0_SETUP.md
    ├── CONTEXT_PHASE_1_BACKEND.md
    ├── CONTEXT_PHASE_2_FRONTEND_CORE.md
    ├── CONTEXT_PHASE_3_PET.md
    ├── CONTEXT_PHASE_4_CHAT.md
    └── CONTEXT_PHASE_5_POLISH.md
```

---

## Contrato de API (fuente de verdad)

Todos los endpoints usan `Content-Type: application/json`.
El header de autenticación es `Authorization: Bearer <token>` donde token = user_id en base64.

### POST /auth/login
```
Request:  { "user_id": "USR-00042", "password": "demo" }
Response: { "token": "VVNSLTAwMDQy", "user_id": "USR-00042" }
```

### GET /user/profile/:id
```
Headers:  Authorization: Bearer <token>
Response: {
  "user_id": "USR-00042",
  "archetype_name": "Joven Profesional Urbano",
  "cluster_id": 2,
  "anomaly_score": 0.12,
  "top_features": ["gasto_restaurantes_alto", "sin_inversion_activa", "score_buro_bueno"],
  "trigger_active": {
    "trigger_id": "T06",
    "name": "Inversión desaprovechada",
    "opening_message": "Tienes $12,000 en tu cuenta que no genera rendimiento...",
    "ctas": ["Ver inversión Hey", "Simular rendimiento", "Ahora no"],
    "pet_skin": "cat_orange"
  }
}
```

### GET /chat/open
```
Query:    ?user_id=USR-00042
Headers:  Authorization: Bearer <token>
Response: {
  "trigger_id": "T06",
  "opening_message": "Tienes $12,000 en tu cuenta...",
  "ctas": ["Ver inversión Hey", "Simular rendimiento", "Ahora no"],
  "pet_skin": "cat_orange"
}
```

### POST /chat/message
```
Headers:  Authorization: Bearer <token>
Request:  { "user_id": "USR-00042", "session_id": "uuid-v4", "message": "Cuéntame más" }
Response: { "reply": "Claro, con Hey Inversiones...", "session_id": "uuid-v4" }
```

---

## Esquema de user_profiles.json (mock)

Cada entrada representa un usuario demo. El campo `trigger_active` es el que alimenta
toda la experiencia proactiva — mascota, speech bubble y primer mensaje del chat.

```json
[
  {
    "user_id": "USR-00042",
    "password": "demo",
    "archetype_name": "Joven Profesional Urbano",
    "cluster_id": 2,
    "anomaly_score": 0.12,
    "top_features": ["gasto_restaurantes_alto", "sin_inversion_activa", "score_buro_bueno"],
    "recent_transactions": [
      {"fecha": "2025-10-01", "comercio": "Spotify", "monto": 99, "categoria": "servicios_digitales", "tipo": "cargo_recurrente"},
      {"fecha": "2025-10-03", "comercio": "Restaurante Toks", "monto": 340, "categoria": "restaurante", "tipo": "compra"}
    ],
    "trigger_active": {
      "trigger_id": "T06",
      "name": "Inversión desaprovechada",
      "opening_message": "Hola 👋 Vi que tienes $12,000 en tu cuenta sin generar rendimiento. Con Hey Inversiones podrías ganar aprox. $96/mes. ¿Lo exploramos?",
      "ctas": ["Ver inversión Hey", "Simular rendimiento", "Ahora no"],
      "pet_skin": "cat_orange"
    }
  }
]
```

**Los 8 triggers y su pet_skin:**

| trigger_id | Nombre | pet_skin |
|-----------|--------|---------|
| T01 | Pago fallido reciente | cat_purple |
| T02 | Suscripciones dormidas | cat_green |
| T03 | Oportunidad Hey Pro | cat_orange |
| T04 | Crédito latente | cat_orange |
| T05 | Gasto inusual detectado | cat_purple |
| T06 | Inversión desaprovechada | cat_orange |
| T07 | Patrón de educación | cat_green |
| T08 | Inactividad de app | cat_gray |

---

## Paleta de colores Hey Banco

```css
--hb-orange:    #FF6B00;   /* acento principal */
--hb-orange-lt: #FFF0E6;   /* fondos suaves */
--hb-purple:    #6B21A8;   /* acento secundario */
--hb-purple-lt: #F3E8FF;
--hb-bg:        #F9F9F9;   /* fondo de app */
--hb-white:     #FFFFFF;
--hb-text:      #1A1A1A;
--hb-text-muted:#6B7280;
--hb-border:    #E5E7EB;
```

---

## Usuarios demo (para el pitch)

Estos 5 user_ids deben estar en `mock/user_profiles.json` con triggers distintos:

| user_id | Archetype | trigger_active | pet_skin |
|---------|-----------|---------------|---------|
| USR-00042 | Joven Profesional | T06 Inversión desaprovechada | cat_orange |
| USR-00101 | Estudiante Digital | T03 Oportunidad Hey Pro | cat_orange |
| USR-00207 | Adulto Precavido | T01 Pago fallido reciente | cat_purple |
| USR-00315 | Usuario Inactivo | T08 Inactividad de app | cat_gray |
| USR-00489 | Emprendedor | T02 Suscripciones dormidas | cat_green |

---

## Reglas de integración entre fases

1. **El contrato de API en este archivo es la fuente de verdad.** Si el equipo de DS entrega
   un `user_profiles_final.json` con diferente estructura, el `profile_loader.py` debe
   normalizar al esquema definido aquí — no al revés.

2. **El frontend nunca llama datos directamente a archivos.** Todo pasa por la API de FastAPI.
   Así, cuando DS reemplace el mock por el modelo real, el frontend no cambia nada.

3. **`pet_skin` es un string que mapea a una carpeta en `public/pets/`.**
   Si DS quiere agregar un nuevo trigger con un skin distinto, solo necesita agregar la carpeta
   con los GIFs y usar ese string en `pet_skin`.

4. **`AppShell.jsx` es el componente raíz post-login.** Todas las páginas nuevas se renderizan
   dentro de él. No crear layouts alternativos — extender AppShell.

5. **El `session_id` del chat es un UUID generado en el frontend** al abrir HaviChat.
   El backend lo usa como key del historial en memoria. Se descarta al cerrar el chat.

---

## Comandos para arrancar

```bash
# Backend
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev          # corre en localhost:5173, proxy a :8000 configurado
```

---

## Fases del proyecto

| Fase | Archivo de contexto | Horas |
|------|--------------------|----|
| 0 — Setup & contratos | CONTEXT_PHASE_0_SETUP.md | H0–H1 |
| 1 — Backend API | CONTEXT_PHASE_1_BACKEND.md | H1–H6 |
| 2 — Frontend core | CONTEXT_PHASE_2_FRONTEND_CORE.md | H3–H9 |
| 3 — Mascota PetSprite | CONTEXT_PHASE_3_PET.md | H6–H12 |
| 4 — Chat Havi | CONTEXT_PHASE_4_CHAT.md | H10–H18 |
| 5 — Polish & pitch | CONTEXT_PHASE_5_POLISH.md | H18–H23 |

> Las fases 1 y 2 corren en paralelo. Las fases 3 y 4 dependen de que 1 y 2 estén listas.
