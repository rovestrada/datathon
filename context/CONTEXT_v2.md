# CONTEXT.md — Havi 360 · Hey Banco Hackathon
> Versión 2.0 — actualizado tras cambios de producto del equipo.
> Este archivo es la fuente de verdad global. Lee esto antes de cualquier archivo de fase.

---

## Visión del producto

**Havi 360** es una demo interactiva de una app bancaria donde HAVI deja de ser un chatbot
escondido detrás de un botón y se convierte en un copiloto financiero omnipresente.

HAVI tiene **Screen-Awareness**: sabe en qué pantalla está el usuario y le habla de forma
contextual a lo que está viendo. El objetivo es que HAVI *sea* la interfaz, no un accesorio.

La mascota pixel-art camina sobre la navbar en todas las pantallas. El usuario elige su
especie/color libremente. Al hacer click, aparece un speech bubble con el mensaje proactivo
del trigger activo. Al tocar el bubble, se abre el chat completo de HAVI.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite, Framer Motion, Tailwind CSS v4, lucide-react |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| LLM | Claude API (`claude-sonnet-4-6`) via `anthropic` SDK |
| ML (equipo DS) | scikit-learn, sentence-transformers, pandas |
| Persistencia | JSON en memoria (hackathon) → SQLite recomendado para demo final |
| Assets mascota | GIFs de vscode-pets (MIT): dog, fox, panda en variantes de color |

---

## Estructura del monorepo

```
havi-360/
├── CONTEXT.md                        ← este archivo (leer siempre primero)
├── api_contract.md                   ← contrato de endpoints (fuente de verdad)
├── mock/
│   ├── user_profiles.json            ← perfiles ML por user_id (entrega DS)
│   └── screen_data/                  ← JSONs de datos por pantalla
│       ├── schema.md                 ← esquema de cada pantalla documentado
│       ├── USR-00042_home.json
│       ├── USR-00042_health.json
│       └── ...                       ← un JSON por (user_id × pantalla)
├── api/
│   ├── main.py
│   ├── routers/
│   │   ├── auth.py                   ← POST /auth/login  (IMPLEMENTADO)
│   │   ├── users.py                  ← GET /user/profile (IMPLEMENTADO)
│   │   ├── chat.py                   ← GET /chat/open, POST /chat/message (IMPLEMENTADO)
│   │   └── screens.py                ← GET /screen/:screen_id (NUEVO fase 2)
│   ├── services/
│   │   ├── profile_loader.py         ← IMPLEMENTADO
│   │   ├── screen_loader.py          ← NUEVO fase 2
│   │   ├── trigger_engine.py         ← IMPLEMENTADO
│   │   └── chat_service.py           ← IMPLEMENTADO (actualizar con screen context)
│   ├── schemas/
│   │   ├── models.py                 ← IMPLEMENTADO
│   │   └── screen_models.py          ← NUEVO fase 2
│   └── requirements.txt
├── frontend/
│   ├── public/pets/
│   │   ├── dog/   (black, brown, red, white) × (idle, run, walk)
│   │   ├── fox/   (red, white) × (idle, run, walk)
│   │   └── panda/ (black, brown) × (idle, run, walk)
│   └── src/
│       ├── context/
│       │   ├── AuthContext.jsx       ← ACTUALIZADO fase 2 (login con caché)
│       │   ├── PetContext.jsx        ← ACTUALIZADO fase 2 (default por arquetipo)
│       │   └── ScreenContext.jsx     ← NUEVO fase 2 (screen-awareness)
│       └── components/
│           └── mobile/
│               ├── MobileApp.jsx     ← [IMPLEMENTADO] Orquestador de sync Pet-Bubble
│               ├── MobileHAVI.jsx    ← [IMPLEMENTADO] Navigation Actions Support
│               ├── MobileHome.jsx    ← [IMPLEMENTADO] Dinámico (ScreenContext)
│               ├── MobileFinancialHealth.jsx ← [IMPLEMENTADO] Dinámico (Score Gauge)
│               ├── MobileStatement.jsx ← [IMPLEMENTADO] Dinámico (Transacciones Reales)
│               └── ...
└── context-phases/
    ├── CONTEXT_PHASE_0_SETUP.md      ← [IMPLEMENTADO]
    ├── CONTEXT_PHASE_1_BACKEND.md    ← [IMPLEMENTADO]
    ├── CONTEXT_PHASE_2_FRONTEND_CORE.md  ← [IMPLEMENTADO]
    ├── CONTEXT_PHASE_3_SCREENS.md    ← [IMPLEMENTADO]
    ├── CONTEXT_PHASE_4_HAVI_OMNIPRESENCE.md  ← [IMPLEMENTADO]
    └── CONTEXT_DS.md                 ← ACTUALIZADO
```

---

## Contrato de API — endpoints

### Ya implementados (Fase 1 — NO MODIFICAR)

```
POST /auth/login          → { token, user_id }
GET  /user/profile/:id    → UserProfile completo
GET  /chat/open           → { trigger_id, opening_message, ctas, pet_skin }
POST /chat/message        → { reply, session_id }
POST /admin/reload        → { status: "reloaded" }
```

### Nuevos (Fase 2 y 3)

```
GET  /screen/:screen_id?user_id=   → ScreenData (datos personalizados por pantalla)
POST /chat/message                 → ACTUALIZAR: añadir current_screen al body
                                     respuesta añade navigation_action opcional
```

### Esquema actualizado de POST /chat/message

```json
Request:
{
  "user_id": "USR-00042",
  "session_id": "uuid",
  "message": "quiero ver mis movimientos",
  "current_screen": "home"
}

Response:
{
  "reply": "Claro, te llevo a tus movimientos...",
  "session_id": "uuid",
  "navigation_action": {
    "screen": "estado",
    "label": "Ver movimientos"
  }
}
```

`navigation_action` es opcional — solo aparece cuando HAVI infiere que el usuario
quiere navegar a otra pantalla. El frontend lo consume para redirigir automáticamente.

---

## Las 9 pantallas del producto y sus datos

### Decisión de diseño: Screen Data JSON

Cada pantalla tiene un JSON de datos personalizado por usuario.
El backend los sirve via `GET /screen/:screen_id?user_id=USR-00042`.
HAVI tiene acceso a estos datos en su system prompt para responder contextualmente.

| screen_id | Pantalla | Fuente de datos |
|-----------|---------|----------------|
| `login` | Login | Caché local (user_id) + dummy |
| `home` | Inicio | ML pipeline + transacciones reales |
| `profile` | Perfil | Datos demográficos (hey_clientes.csv) |
| `health` | Salud Financiera | ML pipeline + productos + transacciones |
| `havi` | Chat HAVI | Trigger activo + historial de sesión |
| `payments` | Pagos | Transacciones filtradas por tipo |
| `transfer` | Transferir | Saldo + historial de transferencias |
| `inbox` | Buzón | Triggers activos como notificaciones |
| `cards` | Tarjetas | hey_productos.csv (crédito/débito) |

---

## Screen Data: esquema por pantalla

Todos los JSONs tienen esta estructura base:

```json
{
  "screen_id": "home",
  "user_id": "USR-00042",
  "havi_context": "...",
  "data": { ... }
}
```

`havi_context` es un string en lenguaje natural que resume lo más relevante de
esta pantalla para ese usuario. El backend lo inyecta al system prompt de Claude
cuando el usuario está en esa pantalla.

### home
```json
{
  "screen_id": "home",
  "user_id": "USR-00042",
  "havi_context": "El usuario está en el inicio. Saldo disponible: $12,400. Tiene 4 suscripciones activas. Su cashback acumulado esta semana es $87.",
  "data": {
    "greeting": "Buenos días, Ivan",
    "saldo_disponible": 12400.00,
    "saldo_hidden": false,
    "cashback_acumulado": 87.50,
    "productos_resumen": [
      { "tipo": "cuenta_debito", "label": "Cuenta Hey", "saldo": 12400.00, "numero": "*001-5" },
      { "tipo": "tarjeta_credito_hey", "label": "Tarjeta Hey", "disponible": 8200.00, "limite": 15000.00 }
    ],
    "accesos_rapidos": ["Transferir", "Pagar", "Depositar"],
    "movimientos_recientes": [
      { "fecha": "2025-10-05", "comercio": "Spotify", "monto": -99.0, "categoria": "servicios_digitales" },
      { "fecha": "2025-10-04", "comercio": "Restaurante Toks", "monto": -340.0, "categoria": "restaurante" }
    ],
    "trigger_banner": {
      "trigger_id": "T06",
      "mensaje_corto": "Tu saldo podría estar generando $99/mes",
      "cta": "Ver inversión"
    }
  }
}
```

### health (Salud Financiera)
```json
{
  "screen_id": "health",
  "user_id": "USR-00042",
  "havi_context": "El usuario ve su salud financiera. Utilización de crédito: 55%. Sin patrones atípicos. Gasta 34% en restaurantes, por encima de su cluster. Score financiero: 72/100.",
  "data": {
    "score_financiero": 72,
    "score_label": "Bueno",
    "utilizacion_credito_pct": 0.55,
    "patron_uso_atipico": false,
    "anomaly_score": 0.12,
    "distribucion_gastos": [
      { "categoria": "restaurante", "pct": 0.34, "monto": 1240.0 },
      { "categoria": "servicios_digitales", "pct": 0.22, "monto": 803.0 },
      { "categoria": "supermercado", "pct": 0.18, "monto": 657.0 }
    ],
    "vs_cluster": {
      "restaurante": "+12% vs usuarios similares",
      "servicios_digitales": "similar al promedio"
    },
    "racha_dias_sin_rechazo": 14,
    "ahorro_potencial_mensual": 320.0,
    "consejos": [
      "Reducir gasto en restaurantes podría ahorrarte $300/mes",
      "Tienes 4 suscripciones: ¿las usas todas?"
    ]
  }
}
```

### cards (Tarjetas)
```json
{
  "screen_id": "cards",
  "user_id": "USR-00042",
  "havi_context": "El usuario ve sus tarjetas. Tarjeta Hey con 55% de utilización ($8,250 de $15,000). Sin cargos rechazados recientes. 3 compras con MSI activas.",
  "data": {
    "tarjetas": [
      {
        "producto_id": "PRD-00000001",
        "tipo": "tarjeta_credito_hey",
        "label": "Tarjeta Hey",
        "numero_ultimo4": "4521",
        "limite": 15000.0,
        "saldo_actual": 8250.0,
        "disponible": 6750.0,
        "utilizacion_pct": 0.55,
        "fecha_corte": "2025-10-15",
        "fecha_pago": "2025-10-25",
        "pago_minimo": 412.0,
        "msi_activos": 3,
        "estatus": "activo"
      }
    ],
    "cuenta_debito": {
      "numero": "*001-5",
      "saldo": 12400.0,
      "clabe": "014580***********"
    }
  }
}
```

### payments (Pagos)
```json
{
  "screen_id": "payments",
  "user_id": "USR-00042",
  "havi_context": "El usuario está en pagos. Sus servicios recurrentes: CFE $420, Telmex $399, Netflix $169. El pago de CFE vence en 3 días.",
  "data": {
    "servicios_guardados": [
      { "nombre": "CFE", "monto_ultimo": 420.0, "dias_para_vencimiento": 3, "categoria": "gobierno" },
      { "nombre": "Telmex", "monto_ultimo": 399.0, "dias_para_vencimiento": 12, "categoria": "gobierno" },
      { "nombre": "Netflix", "monto_ultimo": 169.0, "es_recurrente": true, "categoria": "servicios_digitales" }
    ],
    "historial_pagos": [
      { "fecha": "2025-10-01", "servicio": "CFE", "monto": 420.0, "estatus": "completada" },
      { "fecha": "2025-09-28", "servicio": "Spotify", "monto": 99.0, "estatus": "completada" }
    ],
    "pago_rechazado_reciente": null
  }
}
```

### transfer (Transferir)
```json
{
  "screen_id": "transfer",
  "user_id": "USR-00042",
  "havi_context": "El usuario quiere transferir. Saldo disponible: $12,400. Sus últimos destinatarios: mamá ($2,000 hace 5 días), Netflix autorrecarga.",
  "data": {
    "saldo_disponible": 12400.0,
    "limite_diario": 50000.0,
    "transferido_hoy": 0.0,
    "destinatarios_frecuentes": [
      { "alias": "Mamá", "clabe_last4": "3892", "banco": "Banorte", "ultimo_monto": 2000.0, "hace_dias": 5 },
      { "alias": "Renta", "clabe_last4": "1104", "banco": "BBVA", "ultimo_monto": 6500.0, "hace_dias": 30 }
    ],
    "historial_reciente": [
      { "fecha": "2025-10-01", "alias": "Mamá", "monto": 2000.0, "tipo": "transf_salida", "estatus": "completada" }
    ]
  }
}
```

### inbox (Buzón)
```json
{
  "screen_id": "inbox",
  "user_id": "USR-00042",
  "havi_context": "El buzón tiene 2 notificaciones no leídas: una sobre la inversión desaprovechada y una promoción de MSI.",
  "data": {
    "notificaciones": [
      {
        "id": "notif-001",
        "tipo": "trigger",
        "trigger_id": "T06",
        "titulo": "Tu dinero podría estar generando más",
        "cuerpo": "Tienes $12,400 sin invertir. Hey Inversiones te daría ~$99/mes.",
        "cta": "Ver inversión",
        "leida": false,
        "fecha": "2025-10-05"
      },
      {
        "id": "notif-002",
        "tipo": "promocion",
        "titulo": "3 meses sin intereses en Liverpool",
        "cuerpo": "Usa tu Tarjeta Hey en Liverpool y paga a 3 MSI.",
        "leida": true,
        "fecha": "2025-10-03"
      }
    ],
    "no_leidas": 1
  }
}
```

### profile (Perfil)
```json
{
  "screen_id": "profile",
  "user_id": "USR-00042",
  "havi_context": "El usuario ve su perfil. Es Joven Profesional Urbano, cluster 2. Hey Pro activo. Score buró 720. Usa iOS.",
  "data": {
    "nombre_display": "Ivan G.",
    "archetype_name": "Joven Profesional Urbano",
    "es_hey_pro": true,
    "score_buro": 720,
    "antiguedad_dias": 384,
    "canal_apertura": "App",
    "preferencia_canal": "app_ios",
    "nivel_satisfaccion": 8,
    "productos_activos": 3,
    "tiene_seguro": false,
    "nomina_domiciliada": true,
    "configuracion": {
      "idioma": "es_MX",
      "notificaciones_activas": true,
      "biometrico_activo": true
    }
  }
}
```

### login (datos cacheados localmente)
```
No tiene endpoint en el backend.
El user_id se guarda en localStorage (persiste entre sesiones).
Solo se muestra "Hola de nuevo, Ivan" si el user_id está cacheado.
El token y la sesión siguen en sessionStorage (se limpia al cerrar).
```

---

## Mascota: default por arquetipo, customizable por usuario

El pipeline ML asigna una mascota default según el arquetipo detectado.
El usuario puede cambiarla en cualquier momento desde MobileSettings → Mascota.

| archetype_name | pet_type default | pet_variant default |
|---------------|-----------------|-------------------|
| Joven Profesional Urbano | fox | red |
| Estudiante Digital | panda | black |
| Ahorrador Precavido | dog | white |
| Emprendedor Digital | panda | brown |
| Usuario Inactivo | dog | brown |
| (cualquier otro) | fox | red |

El campo `default_pet` se incluye en `user_profiles.json`:
```json
"default_pet": { "petType": "fox", "petVariant": "red" }
```

Si el usuario nunca ha customizado, se usa `default_pet`.
Si el usuario ya eligió uno en MobileSettings, ese tiene prioridad (guardado en localStorage).

---

## HAVI omnipresente: screen-awareness y navegación inferida

### Cómo funciona el screen context

Cada vez que el usuario envía un mensaje en el chat, el frontend incluye `current_screen`.
El backend inyecta en el system prompt el `havi_context` de esa pantalla.

Claude puede responder con un `navigation_action` cuando infiere que el usuario
quiere ir a otra pantalla. El frontend lo consume y navega automáticamente.

### Intents de navegación que HAVI puede inferir

| Intent del usuario | Screen destino |
|-------------------|---------------|
| "ver mis movimientos" / "qué gasté" | `estado` |
| "transferir" / "mandar dinero" | `transferir` |
| "pagar" / "mis servicios" | `pagos` |
| "mi tarjeta" / "mi crédito" | `cards` |
| "salud financiera" / "cómo voy" | `salud` |
| "mi perfil" / "mis datos" | `ajustes` |
| "mis notificaciones" / "buzón" | `buzon` |
| "inicio" / "home" / "regresar" | `inicio` |

---

## Arquitectura de datos: recomendación de DB

### Para el hackathon (estado actual)
JSON en memoria → suficiente para el demo con 5–8 usuarios.

### Recomendación para demo final / producción

```
SQLite (dev) o PostgreSQL (prod)
├── tabla: user_profiles     ← escrita por el pipeline ML
├── tabla: screen_data       ← escrita por el pipeline ML
├── tabla: sessions          ← escrita por el backend (historial de chat)
└── tabla: pet_preferences   ← escrita por el frontend (customización de mascota)
```

**Frecuencia de actualización del pipeline ML:**
- En producción: cron job diario a las 3am (después del cierre transaccional del día)
- En el hackathon: una sola corrida que genera los JSONs, luego `/admin/reload`
- El backend nunca corre el pipeline — solo lee los resultados

**Flujo con DB:**
```
Pipeline ML → INSERT/UPDATE tabla user_profiles + screen_data
Backend     → SELECT * FROM screen_data WHERE user_id = ? AND screen_id = ?
Frontend    → GET /screen/home?user_id=USR-00042 → datos frescos
```

---

## Lo que cambió vs la versión anterior (resumen para el equipo)

| Feature | Antes | Ahora |
|---------|-------|-------|
| Pet skin | Cambia por trigger del ML | Usuario elige libremente; ML asigna default |
| Login | Sin caché | Cachea user_id + name real; Password manual |
| HAVI | Solo en pantalla de chat | Omnipresente (pixel-art bubble que sigue al pet) |
| Datos por pantalla | Un solo user_profile | Screen Data JSON con havi_context_short |
| Humanización | Códigos USR-XXXXX | Nombres reales (Ivan, Mariana, etc.) |
| Navegación | Manual | HAVI ofrece botones de redirección automática |

---

## Comandos de arranque (sin cambios)

```bash
# Backend
cd api && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev   # localhost:5173
```
