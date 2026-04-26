# CONTEXT_DS.md — Pipeline de Datos & ML
## Havi 360 · Hey Banco Hackathon — v2

> Este archivo es para el equipo de **Data Science / ML**.
> Lee esto completo antes de escribir una sola línea de código.
> **Versión 2: ahora tienes dos entregables, no uno.**

---

## Tu rol en el proyecto

Tú construyes la inteligencia que hace que Havi 360 sepa quién es cada usuario
y qué está mirando. El backend ya está implementado y espera dos entregables:

| # | Entregable | Archivo | Descripción |
|---|-----------|---------|-------------|
| 1 | Perfiles de usuario | `mock/user_profiles.json` | Clustering, anomaly score, trigger activo, mascota default |
| 2 | Datos por pantalla | `mock/screen_data/*.json` | Un JSON por (usuario × pantalla) con datos reales y contexto para HAVI |

**No necesitas tocar el backend ni el frontend.**
**No necesitas aprender FastAPI ni React.**
**Tu trabajo termina cuando entregas ambos conjuntos de archivos.**

Cuando los entregues, Dev llama `POST http://localhost:8000/admin/reload`
y el backend recarga en caliente — sin reiniciar nada.

---

## Qué cambió vs la versión anterior

| Antes | Ahora |
|-------|-------|
| `trigger_active.pet_skin` en el JSON | **Eliminado** — la mascota ya no cambia por ML |
| Sin campo de mascota | **Nuevo campo `default_pet`** — mascota sugerida por arquetipo |
| Un solo JSON de perfiles | **Dos entregables**: perfiles + screen_data por pantalla |
| Sin `havi_context` | **Nuevo campo por pantalla** — texto en lenguaje natural para HAVI |

## Entregable 1 — user_profiles.json

### Esquema completo

```json
[
  {
    "user_id": "USR-00042",
    "password": "demo",
    "full_name": "Ivan Guerrero",
    "email": "ivan.g@hey.inc",
    "archetype_name": "Joven Profesional Urbano",
...
```

    "cluster_id": 2,
    "anomaly_score": 0.12,
    "top_features": [
      "gasto_restaurantes_alto",
      "sin_inversion_activa",
      "score_buro_bueno"
    ],
    "default_pet": {
      "petType": "fox",
      "petVariant": "red"
    },
    "recent_transactions": [
      {
        "fecha": "2025-10-05",
        "comercio": "Spotify",
        "monto": 99.0,
        "categoria": "servicios_digitales",
        "tipo": "cargo_recurrente",
        "estatus": null,
        "motivo": null
      }
    ],
    "trigger_active": {
      "trigger_id": "T06",
      "name": "Inversión desaprovechada",
      "opening_message": "Hola 👋 Tienes $12,400 en tu cuenta sin generar rendimiento. Con Hey Inversiones podrías ganar aprox. $99/mes. ¿Lo exploramos?",
      "ctas": ["Ver inversión Hey", "Simular rendimiento", "Ahora no"]
    }
  }
]
```

### Diferencias clave vs v1

**`trigger_active` ya NO tiene `pet_skin`.**
La mascota la elige el usuario. El ML solo sugiere un default por arquetipo.

**Nuevo campo `default_pet`.**
Se asigna según el arquetipo detectado. El frontend lo usa solo si el usuario
nunca ha personalizado su mascota. Usa exactamente estos valores:

| archetype_name | petType | petVariant |
|---------------|---------|-----------|
| Joven Profesional Urbano | fox | red |
| Estudiante Digital | panda | black |
| Ahorrador Precavido | dog | white |
| Emprendedor Digital | panda | brown |
| Usuario Inactivo | dog | brown |
| (cualquier otro) | fox | red |

Los assets disponibles en el frontend son:
- `dog`: variantes `black`, `brown`, `red`, `white`
- `fox`: variantes `red`, `white`
- `panda`: variantes `black`, `brown`

### Restricciones campo por campo

| Campo | Tipo | Restricción |
|-------|------|-------------|
| `user_id` | `str` | Formato `USR-XXXXX` |
| `password` | `str` | Siempre `"demo"` |
| `archetype_name` | `str` | Max 30 chars, tú lo decides |
| `cluster_id` | `int` | ≥ 0, sale de K-Means, convertir numpy int → Python int |
| `anomaly_score` | `float` | `[0.0, 1.0]`, sale de Isolation Forest normalizado |
| `top_features` | `list[str]` | 2–5 strings en `snake_case` |
| `default_pet.petType` | `str` | `fox` \| `dog` \| `panda` |
| `default_pet.petVariant` | `str` | Ver tabla de variantes arriba |
| `recent_transactions` | `list[dict]` | 3–5 entradas, las más recientes |
| `recent_transactions[].fecha` | `str` | `YYYY-MM-DD` |
| `recent_transactions[].monto` | `float` | > 0 |
| `recent_transactions[].estatus` | `str\|null` | `"no_procesada"` o `null` |
| `recent_transactions[].motivo` | `str\|null` | Solo si `estatus == "no_procesada"` |
| `trigger_active.trigger_id` | `str` | `T01`–`T08` |
| `trigger_active.ctas` | `list[str]` | Exactamente 3, el último SIEMPRE `"Ahora no"` |

---

## Entregable 2 — screen_data/*.json

Este es el entregable nuevo y el más importante para Havi 360.
Cada JSON alimenta una pantalla de la app con datos personalizados por usuario.
**HAVI usa el campo `havi_context` de cada JSON para responder contextualmente
a lo que el usuario está viendo en ese momento.**

### Estructura del directorio

```
mock/screen_data/
├── USR-00042_home.json
├── USR-00042_health.json
├── USR-00042_cards.json
├── USR-00042_inbox.json
├── USR-00042_payments.json
├── USR-00042_transfer.json
├── USR-00042_profile.json
├── USR-00101_home.json
...
```

Nomenclatura: `{user_id}_{screen_id}.json` — siempre en minúsculas.

### Pantallas y su screen_id

| screen_id | Pantalla | Prioridad para el demo |
|-----------|---------|----------------------|
| `home` | Inicio | 🔴 Obligatorio |
| `health` | Salud Financiera | 🔴 Obligatorio |
| `cards` | Tarjetas | 🔴 Obligatorio |
| `inbox` | Buzón | 🔴 Obligatorio |
| `payments` | Pagos | 🟡 Recomendado |
| `transfer` | Transferir | 🟡 Recomendado |
| `profile` | Perfil | 🟢 Opcional |

Para el pitch mínimo viable: **4 pantallas obligatorias × 5 usuarios = 20 archivos**.

### Estructura base de TODOS los screen_data JSONs

```json
{
  "screen_id": "home",
  "user_id": "USR-00042",
  "havi_context": "...",
  "havi_context_short": "...",
  "data": { ... }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `screen_id` | `str` | ID de la pantalla (ver tabla arriba) |
| `user_id` | `str` | ID del usuario |
| `havi_context` | `str` | Párrafo en lenguaje natural para el system prompt de Claude. 2-4 oraciones. Menciona datos numéricos reales del usuario. |
| `havi_context_short` | `str` | Versión corta para el speech bubble de la mascota. Max 60 chars. |
| `data` | `dict` | Datos estructurados que alimentan la UI de esa pantalla. |

**`havi_context` es el campo más crítico.** Claude lo lee completo en cada mensaje
cuando el usuario está en esa pantalla. Ejemplos de calidad:

```
✓ BIEN: "El usuario está en inicio. Saldo disponible: $12,400 MXN. 
         Sus últimas 2 transacciones fueron en Spotify ($99) y Toks ($340). 
         Tiene un trigger activo de inversión desaprovechada."

✗ MAL: "El usuario ve su pantalla de inicio."  ← demasiado genérico, sin datos
✗ MAL: "user_id: USR-00042, saldo: 12400, txns: [...]"  ← no es lenguaje natural
```

---

### Esquemas de `data` por pantalla

#### `home`

```json
{
  "screen_id": "home",
  "user_id": "USR-00042",
  "havi_context": "El usuario está en inicio. Saldo disponible: $12,400 MXN. Sus últimas transacciones: Spotify $99 y Toks $340. Tiene cashback acumulado de $87 esta semana. Trigger activo: inversión desaprovechada.",
  "havi_context_short": "Tu saldo: $12,400 💰",
  "data": {
    "saldo_disponible": 12400.00,
    "cashback_acumulado": 87.50,
    "productos_resumen": [
      {
        "tipo": "cuenta_debito",
        "label": "Cuenta Hey",
        "saldo": 12400.00,
        "numero": "*001-5"
      },
      {
        "tipo": "tarjeta_credito_hey",
        "label": "Tarjeta Hey",
        "disponible": 6750.00,
        "limite": 15000.00
      }
    ],
    "movimientos_recientes": [
      {
        "fecha": "2025-10-05",
        "comercio": "Spotify",
        "monto": -99.0,
        "categoria": "servicios_digitales",
        "tipo": "cargo_recurrente"
      },
      {
        "fecha": "2025-10-04",
        "comercio": "Restaurante Toks",
        "monto": -340.0,
        "categoria": "restaurante",
        "tipo": "compra"
      }
    ],
    "trigger_banner": {
      "trigger_id": "T06",
      "mensaje_corto": "Tu saldo podría generar $99/mes",
      "cta": "Ver inversión"
    }
  }
}
```

**Campos de `data.home` derivados del pipeline:**
- `saldo_disponible` ← `hey_productos.csv` (cuenta_debito.saldo_actual)
- `cashback_acumulado` ← `hey_transacciones.csv` (suma de cashback_generado últimos 7 días)
- `productos_resumen` ← `hey_productos.csv` (productos activos del usuario)
- `movimientos_recientes` ← `hey_transacciones.csv` (últimas 2–3 transacciones)
- `trigger_banner` ← motor de triggers (el mismo trigger del user_profile)

---

#### `health` (Salud Financiera)

```json
{
  "screen_id": "health",
  "user_id": "USR-00042",
  "havi_context": "El usuario ve su salud financiera. Score: 72/100 (Bueno). Utilización de crédito: 55%, dentro del rango saludable. Gasta 34% en restaurantes, 12 puntos por encima de usuarios similares. No tiene patrones de uso atípico. Lleva 14 días sin transacciones rechazadas.",
  "havi_context_short": "Score financiero: 72/100 📊",
  "data": {
    "score_financiero": 72,
    "score_label": "Bueno",
    "score_color": "#22d3ee",
    "utilizacion_credito_pct": 0.55,
    "patron_uso_atipico": false,
    "anomaly_score": 0.12,
    "racha_dias_sin_rechazo": 14,
    "ahorro_potencial_mensual": 320.0,
    "distribucion_gastos": [
      { "categoria": "restaurante", "pct": 0.34, "monto": 1240.0 },
      { "categoria": "servicios_digitales", "pct": 0.22, "monto": 803.0 },
      { "categoria": "supermercado", "pct": 0.18, "monto": 657.0 },
      { "categoria": "transporte", "pct": 0.12, "monto": 438.0 },
      { "categoria": "otros", "pct": 0.14, "monto": 511.0 }
    ],
    "vs_cluster": [
      { "categoria": "restaurante", "diferencia_pct": 12, "label": "+12% vs usuarios similares" },
      { "categoria": "servicios_digitales", "diferencia_pct": 1, "label": "Similar al promedio" }
    ],
    "consejos": [
      "Reducir gasto en restaurantes podría ahorrarte ~$320/mes",
      "Tienes 4 suscripciones digitales activas — ¿las usas todas?"
    ]
  }
}
```

**Campos de `data.health` derivados del pipeline:**
- `score_financiero` ← función derivada: penalizar anomaly_score alto, utilización alta, rechazos frecuentes
- `utilizacion_credito_pct` ← `hey_productos.csv` (promedio de utilizacion_pct de créditos activos)
- `patron_uso_atipico` ← `hey_clientes.csv` o Isolation Forest
- `anomaly_score` ← Isolation Forest
- `racha_dias_sin_rechazo` ← `hey_transacciones.csv` (días desde el último `no_procesada`)
- `distribucion_gastos` ← `hey_transacciones.csv` (pivot por categoria_mcc)
- `vs_cluster` ← comparar con la media del cluster del usuario
- `ahorro_potencial_mensual` ← diferencia de gasto en categorías sobre el promedio del cluster

**Cómo calcular `score_financiero` (sugerencia):**
```python
def calcular_score(row):
    score = 100
    score -= row['anomaly_score'] * 20          # penalizar comportamiento atípico
    score -= min(row['utilizacion_credito_pct'] * 15, 20)  # penalizar uso alto de crédito
    score -= min(row['num_rechazos'] * 5, 15)   # penalizar rechazos
    score += 5 if row['nomina_domiciliada'] else 0
    score += 5 if row['es_hey_pro'] else 0
    return max(0, min(100, round(score)))
```

---

#### `cards` (Tarjetas)

```json
{
  "screen_id": "cards",
  "user_id": "USR-00042",
  "havi_context": "El usuario ve sus tarjetas. Su Tarjeta Hey tiene 55% de utilización ($8,250 de $15,000 de límite). Fecha de pago: 25 de octubre. Pago mínimo: $412. Tiene 3 compras con MSI activas. Su cuenta de débito tiene $12,400.",
  "havi_context_short": "Tarjeta Hey: 55% utilizado 💳",
  "data": {
    "tarjetas_credito": [
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
    },
    "rechazos_recientes": []
  }
}
```

**Campos derivados del pipeline:**
- Todos los campos de `tarjetas_credito` ← `hey_productos.csv` directamente
- `rechazos_recientes` ← `hey_transacciones.csv` filtrado por `no_procesada` y últimos 7 días
- `msi_activos` ← `hey_transacciones.csv` (count de `meses_diferidos` not null en últimos 90 días)

---

#### `inbox` (Buzón)

```json
{
  "screen_id": "inbox",
  "user_id": "USR-00042",
  "havi_context": "El buzón tiene 1 notificación no leída sobre la inversión desaprovechada. También hay una promoción de MSI en Liverpool ya vista.",
  "havi_context_short": "1 sugerencia nueva 💡",
  "data": {
    "no_leidas": 1,
    "notificaciones": [
      {
        "id": "notif-T06-USR-00042",
        "tipo": "trigger",
        "trigger_id": "T06",
        "titulo": "Tu dinero podría generar más",
        "cuerpo": "Tienes $12,400 sin invertir. Hey Inversiones te daría ~$99/mes sin riesgo.",
        "cta": "Ver inversión",
        "leida": false,
        "fecha": "2025-10-05",
        "prioridad": "alta"
      },
      {
        "id": "notif-promo-001",
        "tipo": "promocion",
        "titulo": "3 MSI en Liverpool",
        "cuerpo": "Usa tu Tarjeta Hey en Liverpool y paga a 3 meses sin intereses.",
        "leida": true,
        "fecha": "2025-10-03",
        "prioridad": "normal"
      }
    ]
  }
}
```

**Campos derivados del pipeline:**
- La notificación de tipo `"trigger"` siempre corresponde al `trigger_active` del perfil
- El `id` del trigger-notificación sigue el patrón `notif-{trigger_id}-{user_id}`
- Las promociones son dummy data — puedes usar las mismas para todos los usuarios

---

#### `payments` (Pagos)

```json
{
  "screen_id": "payments",
  "user_id": "USR-00042",
  "havi_context": "El usuario está en pagos. Sus servicios frecuentes: CFE ($420, vence en 3 días), Telmex ($399), Netflix ($169 recurrente). Su último pago fue CFE hace 30 días por $420 completado.",
  "havi_context_short": "CFE vence en 3 días 📅",
  "data": {
    "servicios_frecuentes": [
      {
        "nombre": "CFE",
        "categoria": "gobierno",
        "monto_ultimo": 420.0,
        "dias_para_vencimiento": 3,
        "es_recurrente": false
      },
      {
        "nombre": "Telmex",
        "categoria": "gobierno",
        "monto_ultimo": 399.0,
        "dias_para_vencimiento": 12,
        "es_recurrente": false
      },
      {
        "nombre": "Netflix",
        "categoria": "servicios_digitales",
        "monto_ultimo": 169.0,
        "dias_para_vencimiento": null,
        "es_recurrente": true
      }
    ],
    "historial_pagos_recientes": [
      {
        "fecha": "2025-10-01",
        "servicio": "CFE",
        "monto": 420.0,
        "estatus": "completada"
      }
    ],
    "pago_rechazado_reciente": null
  }
}
```

**Campos derivados del pipeline:**
- `servicios_frecuentes` ← `hey_transacciones.csv` agrupado por `comercio_nombre`
  donde `tipo_operacion` es `pago_servicio` o `cargo_recurrente`
- `dias_para_vencimiento` ← dummy (no hay datos de vencimiento en el dataset)
- `pago_rechazado_reciente` ← último `no_procesada` en `pago_servicio`

---

#### `transfer` (Transferir)

```json
{
  "screen_id": "transfer",
  "user_id": "USR-00042",
  "havi_context": "El usuario quiere transferir. Saldo disponible: $12,400. Sus destinatarios más frecuentes: 'Mamá' (Banorte, hace 5 días, $2,000) y 'Renta' (BBVA, hace 30 días, $6,500). Límite diario: $50,000, sin transferencias hoy.",
  "havi_context_short": "Saldo para transferir: $12,400 💸",
  "data": {
    "saldo_disponible": 12400.0,
    "limite_diario": 50000.0,
    "transferido_hoy": 0.0,
    "destinatarios_frecuentes": [
      {
        "alias": "Mamá",
        "clabe_last4": "3892",
        "banco": "Banorte",
        "ultimo_monto": 2000.0,
        "hace_dias": 5,
        "frecuencia_mensual": 3
      },
      {
        "alias": "Renta",
        "clabe_last4": "1104",
        "banco": "BBVA",
        "ultimo_monto": 6500.0,
        "hace_dias": 30,
        "frecuencia_mensual": 1
      }
    ],
    "historial_reciente": [
      {
        "fecha": "2025-10-01",
        "tipo": "transf_salida",
        "monto": 2000.0,
        "descripcion": "Transferencia enviada",
        "estatus": "completada"
      }
    ]
  }
}
```

**Campos derivados del pipeline:**
- `saldo_disponible` ← `hey_productos.csv` (cuenta_debito.saldo_actual)
- `transferido_hoy` ← `hey_transacciones.csv` (suma transf_salida del día actual)
- `destinatarios_frecuentes` ← `hey_transacciones.csv` agrupado por `descripcion_libre`
  donde `tipo_operacion == "transf_salida"`. Los aliases son dummy.
- `historial_reciente` ← últimas 3 transferencias del usuario

---

#### `profile` (Perfil del usuario)

```json
{
  "screen_id": "profile",
  "user_id": "USR-00042",
  "havi_context": "El usuario ve su perfil. Arquetipo: Joven Profesional Urbano. Hey Pro activo. Score buró: 720. Lleva 384 días con Hey Banco. Abrió su cuenta por App. Usa iOS.",
  "havi_context_short": "Hey Pro activo ⭐",
  "data": {
    "nombre_display": "Cliente Hey",
    "archetype_name": "Joven Profesional Urbano",
    "es_hey_pro": true,
    "score_buro": 720,
    "antiguedad_dias": 384,
    "canal_apertura": "App",
    "preferencia_canal": "app_ios",
    "nivel_satisfaccion": 8,
    "num_productos_activos": 3,
    "tiene_seguro": false,
    "nomina_domiciliada": true,
    "recibe_remesas": false,
    "idioma_preferido": "es_MX"
  }
}
```

**Todos los campos de `data.profile` vienen directamente de `hey_clientes.csv`.**
`nombre_display` es dummy — el dataset es anónimo.

---

## Los 4 módulos que debes implementar

### M1 — ETL / Feature Engineering (sin cambios vs v1)

El código de M1 del CONTEXT_DS v1 sigue siendo válido. No hay cambios.
Generas el `features_df` con una fila por `user_id`.

### M2 — Modelos ML (sin cambios vs v1)

K-Means para `cluster_id` y `archetype_name`.
Isolation Forest para `anomaly_score`.
Top features por desviación del centroide del cluster.
El código de M2 del CONTEXT_DS v1 sigue siendo válido.

### M3 — Motor de triggers (una diferencia: eliminar pet_skin)

El motor de triggers es idéntico al v1 con **una sola diferencia**:
eliminar `pet_skin` de todos los candidatos y del resultado.

```python
# ANTES (v1):
candidates.append({"trigger_id":"T06","score":0.72,"pet_skin":"cat_orange", ...})

# DESPUÉS (v2) — eliminar pet_skin:
candidates.append({"trigger_id":"T06","score":0.72, ...})

# El resultado final tampoco tiene pet_skin:
best = max(candidates, key=lambda x: x["score"])
return {k:v for k,v in best.items() if k not in ("score", "pet_skin")}
```

### M4 — Serialización: user_profiles.json (un campo nuevo)

```python
def get_default_pet(archetype_name: str) -> dict:
    """Asigna mascota por defecto según el arquetipo."""
    PET_MAP = {
        "Joven Profesional Urbano": {"petType": "fox",   "petVariant": "red"},
        "Estudiante Digital":       {"petType": "panda", "petVariant": "black"},
        "Ahorrador Precavido":      {"petType": "dog",   "petVariant": "white"},
        "Emprendedor Digital":      {"petType": "panda", "petVariant": "brown"},
        "Usuario Inactivo":         {"petType": "dog",   "petVariant": "brown"},
    }
    return PET_MAP.get(archetype_name, {"petType": "fox", "petVariant": "red"})


# Pipeline de exportación (actualizado):
profiles = []
for _, row in features_df.iterrows():
    trigger  = evaluate_triggers(row, transacciones)   # ya sin pet_skin
    recent_tx = get_recent_transactions(row["user_id"], transacciones)
    profiles.append({
        "user_id":              row["user_id"],
        "password":             "demo",
        "archetype_name":       row["archetype_name"],
        "cluster_id":           int(row["cluster_id"]),
        "anomaly_score":        round(float(row["anomaly_score"]), 4),
        "top_features":         row["top_features"],
        "default_pet":          get_default_pet(row["archetype_name"]),  # ← NUEVO
        "recent_transactions":  recent_tx,
        "trigger_active":       trigger,   # ← ya sin pet_skin
    })

validate_and_export(profiles)
```

### M5 — Generación de screen_data JSONs (módulo completamente nuevo)

Este módulo genera todos los archivos `mock/screen_data/{user_id}_{screen_id}.json`.

```python
import json
from pathlib import Path

def build_havi_context(screen_id: str, row: pd.Series,
                       transacciones: pd.DataFrame,
                       productos: pd.DataFrame,
                       trigger: dict) -> tuple[str, str]:
    """
    Genera havi_context (largo) y havi_context_short (≤60 chars)
    para cada pantalla. Ambos en lenguaje natural.
    """
    uid = row["user_id"]
    user_tx = transacciones[transacciones["user_id"] == uid]
    user_prod = productos[productos["user_id"] == uid]
    saldo = user_prod[user_prod["tipo_producto"]=="cuenta_debito"]["saldo_actual"].sum()

    if screen_id == "home":
        ultimas = user_tx.sort_values("fecha_hora", ascending=False).head(2)
        tx_str  = " y ".join(
            f"{r['comercio_nombre'] or r['tipo_operacion']} ${r['monto']:.0f}"
            for _, r in ultimas.iterrows()
        ) if len(ultimas) > 0 else "sin movimientos recientes"
        cashback = user_tx["cashback_generado"].sum()
        ctx = (f"El usuario está en inicio. Saldo disponible: ${saldo:,.0f} MXN. "
               f"Últimas transacciones: {tx_str}. "
               f"Cashback acumulado: ${cashback:.0f}. "
               f"Trigger activo: {trigger['name']}.")
        short = f"Tu saldo: ${saldo:,.0f} 💰"[:60]

    elif screen_id == "health":
        util_pct = row.get("utilizacion_credito_pct", 0)
        score    = max(0, min(100, round(
            100 - row.get("anomaly_score",0)*20
                - min(util_pct*15, 20)
                - min(row.get("num_rechazos",0)*5, 15)
                + (5 if row.get("nomina_domiciliada") else 0)
        )))
        racha = int(row.get("dias_desde_ultima_tx", 0))
        ctx = (f"El usuario ve salud financiera. Score: {score}/100. "
               f"Utilización de crédito: {util_pct*100:.0f}%. "
               f"{'Sin' if not row.get('patron_uso_atipico') else 'Con'} patrones atípicos. "
               f"Días sin rechazo: {racha}.")
        short = f"Score financiero: {score}/100 📊"[:60]

    elif screen_id == "cards":
        creditos = user_prod[user_prod["tipo_producto"].str.contains("tarjeta|credito", na=False)]
        if len(creditos) > 0:
            c = creditos.iloc[0]
            util = c.get("utilizacion_pct", 0) or 0
            lim  = c.get("limite_credito", 0) or 0
            sal  = c.get("saldo_actual", 0) or 0
            ctx  = (f"El usuario ve sus tarjetas. Utilización: {util*100:.0f}% "
                    f"(${sal:,.0f} de ${lim:,.0f}). Cuenta débito: ${saldo:,.0f}.")
            short = f"Tarjeta: {util*100:.0f}% utilizado 💳"[:60]
        else:
            ctx   = f"El usuario ve sus tarjetas. Solo cuenta débito con ${saldo:,.0f}."
            short = f"Cuenta Hey: ${saldo:,.0f} 💳"[:60]

    elif screen_id == "inbox":
        ctx   = (f"El buzón tiene 1 notificación no leída: {trigger['name']}. "
                 f"Mensaje: {trigger['opening_message'][:80]}...")
        short = "1 sugerencia nueva 💡"[:60]

    elif screen_id == "payments":
        pagos = user_tx[user_tx["tipo_operacion"].isin(["pago_servicio","cargo_recurrente"])]
        servicios = pagos["comercio_nombre"].dropna().value_counts().head(3).index.tolist()
        srv_str   = ", ".join(servicios) if servicios else "servicios habituales"
        ctx   = f"El usuario está en pagos. Sus servicios frecuentes: {srv_str}."
        short = "Tus servicios y pagos 📄"[:60]

    elif screen_id == "transfer":
        transferencias = user_tx[user_tx["tipo_operacion"]=="transf_salida"]
        ctx   = (f"El usuario quiere transferir. Saldo disponible: ${saldo:,.0f}. "
                 f"Ha realizado {len(transferencias)} transferencias en el historial.")
        short = f"Para transferir: ${saldo:,.0f} 💸"[:60]

    elif screen_id == "profile":
        pro   = "Hey Pro activo" if row.get("es_hey_pro") else "sin Hey Pro"
        ctx   = (f"El usuario ve su perfil. Arquetipo: {row.get('archetype_name','—')}. "
                 f"{pro}. Score buró: {int(row.get('score_buro',0))}. "
                 f"Antigüedad: {int(row.get('antiguedad_dias',0))} días.")
        short = ("Hey Pro activo ⭐" if row.get("es_hey_pro") else "Perfil del usuario")[:60]

    else:
        ctx   = f"El usuario está en la sección {screen_id}."
        short = f"Sección {screen_id}"[:60]

    return ctx, short


def build_screen_data(screen_id: str, row: pd.Series,
                      transacciones: pd.DataFrame,
                      productos: pd.DataFrame,
                      clientes: pd.DataFrame,
                      trigger: dict) -> dict:
    """Construye el dict completo de una pantalla para un usuario."""
    uid = row["user_id"]
    user_tx   = transacciones[transacciones["user_id"] == uid]
    user_prod = productos[productos["user_id"] == uid]
    user_cli  = clientes[clientes["user_id"] == uid].iloc[0] if len(clientes[clientes["user_id"]==uid]) > 0 else pd.Series()

    havi_context, havi_context_short = build_havi_context(
        screen_id, row, transacciones, productos, trigger
    )

    saldo_debito = user_prod[user_prod["tipo_producto"]=="cuenta_debito"]["saldo_actual"].sum()

    # ── data por pantalla ──────────────────────────────────────────────────────
    if screen_id == "home":
        ultimas = user_tx.sort_values("fecha_hora", ascending=False).head(3)
        movs = [{"fecha": str(r["fecha_hora"])[:10],
                 "comercio": str(r.get("comercio_nombre") or r["tipo_operacion"]),
                 "monto": -float(r["monto"]) if r["tipo_operacion"] in ["compra","pago_servicio","transf_salida"] else float(r["monto"]),
                 "categoria": str(r.get("categoria_mcc","transferencia")),
                 "tipo": str(r["tipo_operacion"])}
                for _, r in ultimas.iterrows()]
        data = {
            "saldo_disponible": float(saldo_debito),
            "cashback_acumulado": float(user_tx["cashback_generado"].sum()),
            "productos_resumen": [{"tipo": p["tipo_producto"], "label": p["tipo_producto"].replace("_"," ").title(),
                                   "saldo": float(p.get("saldo_actual",0) or 0)} for _, p in user_prod[user_prod["estatus"]=="activo"].head(2).iterrows()],
            "movimientos_recientes": movs,
            "trigger_banner": {"trigger_id": trigger["trigger_id"], "mensaje_corto": trigger["opening_message"][:60], "cta": trigger["ctas"][0]},
        }

    elif screen_id == "health":
        util_pct = float(row.get("utilizacion_credito_pct") or 0)
        score    = max(0, min(100, round(100 - row.get("anomaly_score",0)*20 - min(util_pct*15,20) - min(row.get("num_rechazos",0)*5,15) + (5 if row.get("nomina_domiciliada") else 0))))
        mcc_cols = [c for c in row.index if c.startswith("gasto_") and c != "gasto_total_mxn"]
        total_gasto = max(float(row.get("gasto_total_mxn", 1)), 1)
        dist = [{"categoria": c.replace("gasto_",""), "pct": round(float(row.get(c,0))/total_gasto, 3), "monto": float(row.get(c,0))} for c in sorted(mcc_cols, key=lambda x: -row.get(x,0))[:5]]
        data = {
            "score_financiero": score,
            "score_label": "Excelente" if score>=85 else "Bueno" if score>=65 else "Regular" if score>=45 else "Mejorable",
            "utilizacion_credito_pct": util_pct,
            "patron_uso_atipico": bool(row.get("patron_uso_atipico", False)),
            "anomaly_score": float(row.get("anomaly_score", 0)),
            "racha_dias_sin_rechazo": int(row.get("dias_desde_ultima_tx", 0)),
            "ahorro_potencial_mensual": float(max(0, total_gasto * 0.10)),
            "distribucion_gastos": dist,
            "consejos": [f"Tu gasto en {dist[0]['categoria']} es el más alto", "Revisa tus suscripciones activas"] if dist else [],
        }

    elif screen_id == "cards":
        creditos = user_prod[user_prod["tipo_producto"].str.contains("tarjeta|credito", na=False)].to_dict("records")
        tarjetas = [{"producto_id": p.get("producto_id",""), "tipo": p.get("tipo_producto",""),
                     "label": p.get("tipo_producto","").replace("_"," ").title(),
                     "limite": float(p.get("limite_credito") or 0),
                     "saldo_actual": float(p.get("saldo_actual") or 0),
                     "disponible": float((p.get("limite_credito") or 0) - (p.get("saldo_actual") or 0)),
                     "utilizacion_pct": float(p.get("utilizacion_pct") or 0),
                     "estatus": p.get("estatus","activo")} for p in creditos]
        rechazos_rec = user_tx[(user_tx["estatus"]=="no_procesada")].tail(2).to_dict("records")
        data = {
            "tarjetas_credito": tarjetas,
            "cuenta_debito": {"saldo": float(saldo_debito), "numero": "*001-5"},
            "rechazos_recientes": [{"fecha": str(r["fecha_hora"])[:10],
                                    "comercio": str(r.get("comercio_nombre","")),
                                    "monto": float(r["monto"]),
                                    "motivo": str(r.get("motivo_no_procesada",""))} for r in rechazos_rec],
        }

    elif screen_id == "inbox":
        data = {
            "no_leidas": 1,
            "notificaciones": [
                {"id": f"notif-{trigger['trigger_id']}-{uid}", "tipo": "trigger",
                 "trigger_id": trigger["trigger_id"], "titulo": trigger["name"],
                 "cuerpo": trigger["opening_message"], "cta": trigger["ctas"][0],
                 "leida": False, "fecha": str(user_tx["fecha_hora"].max())[:10] if len(user_tx)>0 else "2025-10-05", "prioridad": "alta"},
                {"id": "notif-promo-001", "tipo": "promocion", "titulo": "3 MSI en Liverpool",
                 "cuerpo": "Usa tu Tarjeta Hey en Liverpool y paga a 3 meses sin intereses.",
                 "leida": True, "fecha": "2025-10-03", "prioridad": "normal"},
            ],
        }

    elif screen_id == "payments":
        pagos = user_tx[user_tx["tipo_operacion"].isin(["pago_servicio","cargo_recurrente"])]
        servicios = (pagos.groupby("comercio_nombre")["monto"].mean()
                     .reset_index().sort_values("monto", ascending=False).head(5))
        svcs = [{"nombre": str(r["comercio_nombre"]), "monto_ultimo": float(r["monto"]),
                 "es_recurrente": True, "dias_para_vencimiento": None} for _, r in servicios.iterrows()]
        data = {"servicios_frecuentes": svcs, "historial_pagos_recientes": [], "pago_rechazado_reciente": None}

    elif screen_id == "transfer":
        transfers = user_tx[user_tx["tipo_operacion"]=="transf_salida"].sort_values("fecha_hora", ascending=False)
        hist = [{"fecha": str(r["fecha_hora"])[:10], "tipo": "transf_salida",
                 "monto": float(r["monto"]), "estatus": str(r["estatus"])} for _, r in transfers.head(3).iterrows()]
        data = {"saldo_disponible": float(saldo_debito), "limite_diario": 50000.0,
                "transferido_hoy": 0.0, "destinatarios_frecuentes": [], "historial_reciente": hist}

    elif screen_id == "profile":
        data = {
            "nombre_display":      "Cliente Hey",
            "archetype_name":      str(row.get("archetype_name", "")),
            "es_hey_pro":          bool(user_cli.get("es_hey_pro", False)),
            "score_buro":          int(user_cli.get("score_buro", 0)),
            "antiguedad_dias":     int(user_cli.get("antiguedad_dias", 0)),
            "canal_apertura":      str(user_cli.get("canal_apertura", "App")),
            "preferencia_canal":   str(user_cli.get("preferencia_canal", "app_ios")),
            "nivel_satisfaccion":  int(user_cli.get("satisfaccion_1_10", 7)),
            "num_productos_activos": int(user_cli.get("num_productos_activos", 0)),
            "tiene_seguro":        bool(user_cli.get("tiene_seguro", False)),
            "nomina_domiciliada":  bool(user_cli.get("nomina_domiciliada", False)),
            "recibe_remesas":      bool(user_cli.get("recibe_remesas", False)),
            "idioma_preferido":    str(user_cli.get("idioma_preferido", "es_MX")),
        }
    else:
        data = {}

    return {
        "screen_id":           screen_id,
        "user_id":             uid,
        "havi_context":        havi_context,
        "havi_context_short":  havi_context_short,
        "data":                data,
    }


def export_screen_data(features_df, transacciones, productos, clientes,
                       triggers_map: dict,
                       screens=("home","health","cards","inbox","payments","transfer","profile"),
                       output_dir="mock/screen_data"):
    """Genera todos los archivos screen_data para todos los usuarios."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    total = 0
    for _, row in features_df.iterrows():
        uid     = row["user_id"]
        trigger = triggers_map.get(uid, {})
        for screen_id in screens:
            screen_dict = build_screen_data(screen_id, row, transacciones, productos, clientes, trigger)
            fname = Path(output_dir) / f"{uid}_{screen_id}.json"
            fname.write_text(json.dumps(screen_dict, ensure_ascii=False, indent=2), encoding="utf-8")
            total += 1
    print(f"[screen_export] ✓ {total} archivos escritos en {output_dir}/")
    print("[screen_export] Avisa a Dev: POST http://localhost:8000/admin/reload")
```

---

## Validación completa antes de entregar

```python
import json
from pathlib import Path

def validate_all(profiles_path="mock/user_profiles.json",
                 screen_dir="mock/screen_data"):
    errors = []

    # ── Validar user_profiles.json ────────────────────────────────────────────
    profiles = json.loads(Path(profiles_path).read_text(encoding="utf-8"))
    VALID_TRIGGERS = {"T01","T02","T03","T04","T05","T06","T07","T08"}
    VALID_PET_TYPES    = {"fox","dog","panda"}
    VALID_PET_VARIANTS = {"red","white","black","brown"}

    for p in profiles:
        uid = p.get("user_id","?")
        if p.get("password") != "demo":
            errors.append(f"[profile] {uid}: password != 'demo'")
        if not 0.0 <= p.get("anomaly_score",-1) <= 1.0:
            errors.append(f"[profile] {uid}: anomaly_score fuera de [0,1]")
        dp = p.get("default_pet", {})
        if dp.get("petType") not in VALID_PET_TYPES:
            errors.append(f"[profile] {uid}: default_pet.petType inválido: {dp.get('petType')}")
        if dp.get("petVariant") not in VALID_PET_VARIANTS:
            errors.append(f"[profile] {uid}: default_pet.petVariant inválido: {dp.get('petVariant')}")
        t = p.get("trigger_active", {})
        if "pet_skin" in t:
            errors.append(f"[profile] {uid}: trigger_active NO debe tener pet_skin (eliminado en v2)")
        if t.get("trigger_id") not in VALID_TRIGGERS:
            errors.append(f"[profile] {uid}: trigger_id inválido: {t.get('trigger_id')}")
        if len(t.get("ctas",[])) != 3:
            errors.append(f"[profile] {uid}: ctas debe tener 3 elementos")
        if t.get("ctas",["","",""])[-1] != "Ahora no":
            errors.append(f"[profile] {uid}: último CTA debe ser 'Ahora no'")
        if len(p.get("recent_transactions",[])) < 3:
            errors.append(f"[profile] {uid}: necesita al menos 3 recent_transactions")

    # ── Validar screen_data ───────────────────────────────────────────────────
    REQUIRED_SCREENS = ["home","health","cards","inbox"]
    DEMO_USERS = [p["user_id"] for p in profiles[:5]]

    for uid in DEMO_USERS:
        for screen in REQUIRED_SCREENS:
            f = Path(screen_dir) / f"{uid}_{screen}.json"
            if not f.exists():
                errors.append(f"[screen] FALTA: {f.name}")
                continue
            d = json.loads(f.read_text(encoding="utf-8"))
            if not d.get("havi_context"):
                errors.append(f"[screen] {f.name}: havi_context vacío")
            if not d.get("havi_context_short"):
                errors.append(f"[screen] {f.name}: havi_context_short vacío")
            if len(d.get("havi_context_short","")) > 60:
                errors.append(f"[screen] {f.name}: havi_context_short > 60 chars")
            if not d.get("data"):
                errors.append(f"[screen] {f.name}: data vacío")

    # ── Reporte ───────────────────────────────────────────────────────────────
    if errors:
        print(f"\n✗ {len(errors)} errores encontrados:")
        for e in errors: print(f"  {e}")
        raise ValueError("Corrige los errores antes de entregar.")
    else:
        print(f"\n✓ Validación completa OK")
        print(f"  {len(profiles)} perfiles en user_profiles.json")
        print(f"  {len(list(Path(screen_dir).glob('*.json')))} archivos en screen_data/")
        print("\n  Avisa a Dev: POST http://localhost:8000/admin/reload")
```

---

## Usuarios prioritarios para el demo

| user_id | Trigger | Arquetipo | default_pet |
|---------|---------|-----------|-------------|
| USR-00042 | T06 Inversión desaprovechada | Joven Profesional Urbano | fox/red |
| USR-00101 | T03 Oportunidad Hey Pro | Estudiante Digital | panda/black |
| USR-00207 | T01 Pago fallido reciente | Ahorrador Precavido | dog/white |
| USR-00315 | T08 Inactividad de app | Usuario Inactivo | dog/brown |
| USR-00489 | T02 Suscripciones dormidas | Emprendedor Digital | panda/brown |

---

## Estructura de notebooks recomendada

```
pipeline/
├── 01_eda.ipynb
├── 02_feature_engineering.ipynb
├── 03_clustering.ipynb
├── 04_anomaly_detection.ipynb
├── 05_trigger_engine.ipynb
├── 06_export_profiles.ipynb      ← escribe mock/user_profiles.json
└── 07_export_screen_data.ipynb   ← escribe mock/screen_data/*.json
```

---

## Hitos de entrega

| Hito | Hora | Entrega |
|------|------|---------|
| H7  | 7h | `user_profiles.json` con los 5 usuarios demo. Screen data puede ser dummy. |
| H14 | 14h | Ambos entregables completos con modelo real. |

H7 es el hito más crítico — desbloquea todo el trabajo de integración de Dev y Frontend.
