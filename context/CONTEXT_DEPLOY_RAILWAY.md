# CONTEXT_DEPLOY_RAILWAY.md — Deploy en Railway
## Havi 360 · Hey Banco Hackathon

> Lee este archivo de principio a fin antes de tocar nada.
> Tiempo estimado: 45–90 min si tienes experiencia con deploys.
>                  2–3 horas si es tu primera vez.
> Hazlo en la hora 6–8 del hackathon, no al final.

---

## Arquitectura en producción

En local tienes un proceso: Vite sirve el frontend y hace proxy al backend.
En Railway son **dos servicios independientes** con URLs distintas:

```
Railway Service 1: havi-api
  URL: https://havi-api-xxxx.railway.app
  Corre: uvicorn api.main:app

Railway Service 2: havi-frontend
  URL: https://havi-frontend-xxxx.railway.app
  Corre: npm run build → sirve el dist/ estático con Caddy/nginx
```

El frontend en producción no tiene proxy de Vite. Llama directamente a la URL
del backend. Por eso hay que configurar `VITE_API_URL` antes del build.

```
Local:       fetch('/api/chat/message')  → proxy Vite → localhost:8000
Producción:  fetch(`${VITE_API_URL}/chat/message`)  → havi-api.railway.app
```

---

## Cambios de código necesarios ANTES de hacer el deploy

Estos cambios van al repo. Sin ellos el deploy falla o el CORS bloquea todo.

### Cambio 1 — api/main.py: CORS dinámico

El `allow_origins` actual tiene `localhost:5173` hardcodeado. En producción
necesita la URL de Railway. Reemplaza el middleware de CORS:

```python
# api/main.py — reemplazar el bloque de CORSMiddleware

import os

# Orígenes permitidos: leer de variable de entorno en producción,
# localhost en desarrollo
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173"   # default para desarrollo local
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

En Railway, configurarás:
```
ALLOWED_ORIGINS=https://havi-frontend-xxxx.railway.app
```

Si aún no sabes la URL del frontend, puedes usar `allow_origins=["*"]`
**temporalmente** durante el hackathon. Es menos seguro pero funciona
para un demo de 24 horas.

---

### Cambio 2 — frontend/src/services/api.js: URL dinámica del backend

Crea este archivo si no existe, o actualiza el existente:

```js
// frontend/src/services/api.js

// En producción: VITE_API_URL viene del build de Railway
// En desarrollo: usa el proxy de Vite (cadena vacía = relativo)
const API_BASE = import.meta.env.VITE_API_URL ?? ''

export const http = {
  async get(path, token) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return res
  },

  async post(path, body, token) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    return res
  },
}
```

**Si el equipo ya tiene llamadas a `fetch('/api/...')` dispersas por el código:**
No hace falta refactorizar todo ahora. La forma más rápida es agregar esta
constante al inicio de cada archivo que haga fetch:

```js
const API = import.meta.env.VITE_API_URL ?? ''
// luego reemplazar '/api/auth/login' por `${API}/auth/login`
// (sin el prefijo /api/ — en producción se llama directo al backend)
```

O si prefieres hacerlo en un solo lugar, en `vite.config.js` define un alias:

```js
// vite.config.js — agregar define para que el string se reemplace en build
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Disponible en todo el código como __API_URL__
    __API_URL__: JSON.stringify(process.env.VITE_API_URL ?? ''),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

> **Decisión rápida para el hackathon:** si el tiempo apremia, agrega
> `VITE_API_URL` como variable de entorno en Railway y haz un find+replace
> global en el frontend de `/api/` por `${import.meta.env.VITE_API_URL}/`.
> Son 5 minutos con el editor.

---

### Cambio 3 — Archivos de configuración para Railway

Railway detecta automáticamente Python y Node.js, pero necesita saber
cómo arrancar cada servicio.

**Para el backend**, crea `api/Procfile`:
```
web: uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

O alternativamente `railway.json` en la raíz del backend:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn api.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

**Para el frontend**, Railway necesita saber que es un static site.
Crea `frontend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve dist -s -l $PORT",
    "staticDir": "dist"
  }
}
```

Agrega `serve` a las dependencias del frontend:
```bash
cd frontend && npm install --save-dev serve
```

---

### Cambio 4 — mock/user_profiles.json en el repo

Railway tiene **filesystem efímero** — los archivos que no están en el repo
se pierden si el servicio se reinicia. El `user_profiles.json` y los
`screen_data/*.json` deben estar commiteados.

Verifica que `.gitignore` no los está ignorando:

```bash
# En la raíz del proyecto:
git check-ignore -v mock/user_profiles.json
git check-ignore -v mock/screen_data/
# Si aparece alguna regla, elimínala del .gitignore
```

Si los archivos son muy grandes para el repo (> 10MB), la alternativa es
codificarlos como variable de entorno en Railway:

```bash
# Comprimir el JSON como base64 y pegarlo como variable
cat mock/user_profiles.json | base64 | tr -d '\n'
# Pegar el resultado como USER_PROFILES_B64 en Railway
```

Y en `profile_loader.py` agregar:
```python
import base64, os

def load_profiles(path: str = "mock/user_profiles.json") -> None:
    global _profiles
    # Primero intentar desde variable de entorno (Railway)
    b64 = os.getenv("USER_PROFILES_B64")
    if b64:
        data = json.loads(base64.b64decode(b64).decode("utf-8"))
    else:
        # Fallback: leer del archivo (desarrollo local)
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    _profiles = {u["user_id"]: u for u in data}
    print(f"[loader] {len(_profiles)} perfiles cargados")
```

**Recomendación para el hackathon:** commitea los JSONs directamente al repo.
Es más simple, y para un demo de 24 horas la seguridad de los datos no es una
preocupación (los datos son sintéticos de todas formas).

---

## Paso a paso del deploy

### Paso 1 — Aplicar los cambios de código

```bash
# Aplicar Cambio 1 (CORS), Cambio 2 (API URL), Cambio 3 (railway.json),
# Cambio 4 (commitear JSONs)
git add .
git commit -m "chore: preparar para deploy en Railway"
git push origin main
```

---

### Paso 2 — Crear el proyecto en Railway

1. Ve a [railway.app](https://railway.app) → New Project
2. Elige **Deploy from GitHub repo**
3. Conecta tu repositorio `havi-360`
4. Railway detectará que hay dos carpetas deployables (`api/` y `frontend/`)

---

### Paso 3 — Configurar el servicio del Backend

En Railway, selecciona **New Service → GitHub Repo → carpeta `api/`**
(o configura el Root Directory como `api` en la configuración del servicio).

**Variables de entorno a configurar en Railway (Settings → Variables):**

```
ANTHROPIC_API_KEY     = sk-ant-tu-key-aqui
ALLOWED_ORIGINS       = https://havi-frontend-xxxx.railway.app
                        (actualizar después de crear el servicio de frontend)
```

**Verificar que el build funciona:**
En los logs de Railway debe aparecer:
```
[loader] 5 perfiles cargados desde 'mock/user_profiles.json'
[screen_loader] 20 screen_data cargados
INFO: Application startup complete.
```

**Verificar health:**
```bash
curl https://havi-api-xxxx.railway.app/health
# → {"status": "ok"}
```

---

### Paso 4 — Configurar el servicio del Frontend

En Railway, **New Service → GitHub Repo → carpeta `frontend/`**
(Root Directory: `frontend`).

**Variables de entorno:**
```
VITE_API_URL = https://havi-api-xxxx.railway.app
```

> ⚠️ `VITE_API_URL` debe estar configurada **antes del build**. Railway inyecta
> las variables en tiempo de build para Vite (no en runtime como en un servidor).
> Si la configuras después del primer build, tienes que hacer redeploy.

**Verificar el build:**
En los logs debe aparecer:
```
> vite build
✓ built in Xs
dist/index.html
dist/assets/...
```

---

### Paso 5 — Actualizar ALLOWED_ORIGINS en el backend

Una vez que tienes la URL del frontend de Railway:

1. Ve al servicio `havi-api` en Railway → Variables
2. Actualiza `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS = https://havi-frontend-xxxx.railway.app
   ```
3. Railway reinicia el servicio automáticamente

---

### Paso 6 — Verificar la integración completa

```bash
# 1. Health del backend
curl https://havi-api-xxxx.railway.app/health

# 2. Login
curl -s -X POST https://havi-api-xxxx.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USR-00042","password":"demo"}'

# 3. Abrir el frontend en el browser
open https://havi-frontend-xxxx.railway.app

# 4. Login en la UI → verificar en Network que las llamadas
#    van a havi-api.railway.app (no a localhost)
```

---

## Variables de entorno — referencia completa

### Backend (havi-api)

| Variable | Valor | Obligatoria |
|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | ✅ Sí |
| `ALLOWED_ORIGINS` | `https://havi-frontend-xxxx.railway.app` | ✅ Sí |
| `PORT` | Railway lo inyecta automáticamente | ⚙️ Auto |
| `USER_PROFILES_B64` | Base64 del JSON | Solo si no commiteas el JSON |

### Frontend (havi-frontend)

| Variable | Valor | Obligatoria |
|----------|-------|-------------|
| `VITE_API_URL` | `https://havi-api-xxxx.railway.app` | ✅ Sí |
| `PORT` | Railway lo inyecta automáticamente | ⚙️ Auto |

---

## Estructura de archivos final post-cambios

```
havi-360/
├── api/
│   ├── main.py              ← CORS dinámico con ALLOWED_ORIGINS
│   ├── Procfile             ← NUEVO: comando de arranque
│   ├── railway.json         ← NUEVO: config de Railway
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── services/
│   │       └── api.js       ← ACTUALIZADO: usa VITE_API_URL
│   ├── railway.json         ← NUEVO: config de Railway + serve
│   ├── vite.config.js       ← sin cambios (proxy solo aplica en dev)
│   └── package.json         ← agregar serve como devDependency
└── mock/
    ├── user_profiles.json   ← DEBE estar en el repo
    └── screen_data/         ← DEBE estar en el repo
        ├── USR-00042_home.json
        └── ...
```

---

## Troubleshooting rápido

**El frontend llama a `localhost:8000` en producción**
`VITE_API_URL` no estaba configurada cuando se hizo el build. Ve a Railway →
frontend service → Variables → agrega `VITE_API_URL` → Redeploy.

**Error CORS en el browser**
`ALLOWED_ORIGINS` en el backend no tiene la URL del frontend de Railway, o
tiene un trailing slash (`https://...app/` en lugar de `https://...app`).
Verifica que el valor sea exactamente la URL que aparece en el browser.

**`[loader] 0 perfiles cargados` en los logs del backend**
`mock/user_profiles.json` no está en el repo o el path es incorrecto.
Railway clona el repo desde la raíz del servicio — si el Root Directory es `api/`,
el path `mock/user_profiles.json` busca en `api/mock/`. Tienes dos opciones:
(a) mover `mock/` dentro de `api/`, o (b) cambiar el Root Directory a la raíz
del repo y configurar el start command como `uvicorn api.main:app ...`.

**Build del frontend falla con `Cannot find module`**
Alguna dependencia no está en `package.json`. Revisa que el `npm install`
local resuelve todas las dependencias antes de hacer push.

**Railway no detecta Python / Node**
Verifica que el Root Directory de cada servicio esté configurado correctamente:
`api` para el backend, `frontend` para el frontend. Sin esto Railway intenta
buildear desde la raíz y no encuentra ni `requirements.txt` ni `package.json`
en el lugar esperado.

**El servicio se reinicia y pierde el historial de sesiones del chat**
Es esperado — `_sessions` vive en memoria. Para el hackathon no es problema
porque cada demo es una sesión nueva. Si quieres persistencia, necesitarías Redis,
que está fuera del scope de 24 horas.

---

## Comandos de verificación post-deploy

Una vez todo deployado, corre esto desde tu terminal local para confirmar
que el backend de producción responde correctamente:

```bash
PROD_API="https://havi-api-xxxx.railway.app"  # ← reemplazar con tu URL real

echo "=== Health ===" && \
curl -s $PROD_API/health && echo ""

echo "=== Login ===" && \
TOKEN=$(curl -s -X POST $PROD_API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USR-00042","password":"demo"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])") && \
echo "Token: $TOKEN"

echo "=== Chat open ===" && \
curl -s "$PROD_API/chat/open?user_id=USR-00042" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('trigger:', d['trigger_id'], '| skin:', d.get('pet_skin','N/A'))"

echo "=== Screen data ===" && \
curl -s "$PROD_API/screen/home?user_id=USR-00042" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('havi_context:', d['havi_context'][:60])"

echo "" && echo "=== Deploy OK si todos los pasos devolvieron datos ==="
```
