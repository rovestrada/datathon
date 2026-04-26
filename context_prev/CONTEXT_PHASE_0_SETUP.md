# CONTEXT_PHASE_0_SETUP.md — Setup & Contratos

> Lee CONTEXT.md global antes de este archivo.
> Esta fase tarda ~1.5 horas. No escribas código de lógica aquí — solo estructura.

---

## Objetivo de esta fase

Dejar el repositorio listo para que las fases 1 y 2 puedan arrancar en paralelo sin bloquearse.
El entregable más importante es `mock/user_profiles.json` porque es lo que desbloquea
a todos los demás: el backend puede servir datos reales desde hora 1, y el frontend
puede integrarse sin esperar al equipo de ML.

---

## Tareas

### S01 — Crear el monorepo

Crea la siguiente estructura de carpetas exactamente como se define en CONTEXT.md:

```
havi-proactivo/
├── api/
│   ├── routers/        (vacío, con __init__.py)
│   ├── services/       (vacío, con __init__.py)
│   ├── schemas/        (vacío, con __init__.py)
│   ├── main.py         (placeholder — ver S01 abajo)
│   └── requirements.txt
├── frontend/
│   ├── public/pets/    (vacío — los GIFs se agregan en fase 3)
│   └── src/
│       ├── context/
│       ├── pages/
│       ├── components/
│       └── services/
├── mock/
├── context-phases/
└── CONTEXT.md          (ya existe)
```

**`api/main.py` placeholder:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Havi API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
```

**`api/requirements.txt`:**
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
anthropic==0.28.0
python-dotenv==1.0.1
```

**Inicializar frontend con Vite:**
```bash
cd frontend
npm create vite@latest . -- --template react
npm install react-router-dom axios
```

**`frontend/vite.config.js`** — agregar proxy:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

Todas las llamadas del frontend usarán el prefijo `/api/` — el proxy stripea el prefijo
antes de llegar al backend. Ejemplo: `axios.get('/api/user/profile/USR-00042')`.

---

### S02 — Crear api_contract.md

Copia el bloque completo de "Contrato de API" de CONTEXT.md a un archivo
`api_contract.md` en la raíz. Este archivo es la referencia que usan ambos lados
del equipo. No lo modifiques sin consenso.

---

### S03 — Crear mock/user_profiles.json

Este es el entregable más crítico de la fase. Crea el archivo con los 5 usuarios
demo definidos en CONTEXT.md. Cada usuario debe tener el esquema exacto descrito
en la sección "Esquema de user_profiles.json".

Requisitos del mock:
- Los 5 `user_id` son exactamente los de la tabla de usuarios demo en CONTEXT.md.
- Todos tienen `"password": "demo"`.
- Cada usuario tiene un `trigger_active` diferente, cubriendo al menos 4 pet_skins distintos.
- Cada `recent_transactions` tiene 3–5 entradas coherentes con el arquetipo del usuario.
- Los `opening_message` están escritos en español, son específicos (mencionan montos
  o nombres reales del mock), y tienen tono conversacional amigable.
- Los `ctas` tienen exactamente 3 opciones. La última siempre es "Ahora no".

**Ejemplo de opening_message bien escrito (T01 — pago fallido):**
```
"Hola 👋 Ayer tu pago de $234 en Superama no se procesó porque no tenías saldo suficiente.
¿Quieres que te active una alerta cuando tu saldo baje de cierto monto?"
```

**Ejemplo de opening_message mal escrito (no hacer esto):**
```
"Detecté una anomalía transaccional en tu historial."   ← demasiado técnico
"¡Hola! ¿En qué te puedo ayudar hoy?"                  ← no es proactivo, no tiene contexto
```

---

## Checklist de salida de esta fase

Antes de avanzar a la fase 1 o 2, verificar que:

- [ ] `api/main.py` responde `{"status": "ok"}` en `GET /health`
- [ ] `frontend/` arranca con `npm run dev` sin errores
- [ ] El proxy de Vite está configurado (`/api` → `:8000`)
- [ ] `mock/user_profiles.json` tiene los 5 usuarios con el esquema correcto
- [ ] Los 5 usuarios tienen `pet_skin` distintos entre sí (no todos el mismo)
- [ ] `api_contract.md` está en la raíz y es idéntico al bloque de CONTEXT.md

---

## Lo que NO hacer en esta fase

- No instalar librerías de ML (pandas, scikit-learn) — eso es del equipo DS.
- No crear páginas de React todavía — solo el scaffolding.
- No inventar endpoints adicionales — el contrato está cerrado.
- No usar base de datos — todo en memoria y JSON.
