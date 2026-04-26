# api_contract.md — Contrato de API

> Fuente de verdad. No modificar sin consenso del equipo.
> Todos los endpoints usan `Content-Type: application/json`.
> Auth header: `Authorization: Bearer <token>` donde token = base64(user_id).

---

## POST /auth/login

```
Request:
{
  "user_id": "USR-00042",
  "password": "demo"
}

Response 200:
{
  "token": "VVNSLTAwMDQy",
  "user_id": "USR-00042"
}

Response 401:
{
  "detail": "Credenciales inválidas"
}
```

---

## GET /user/profile/:id

```
Headers: Authorization: Bearer <token>

Response 200:
{
  "user_id": "USR-00042",
  "archetype_name": "Joven Profesional Urbano",
  "cluster_id": 2,
  "anomaly_score": 0.12,
  "top_features": [
    "gasto_restaurantes_alto",
    "sin_inversion_activa",
    "score_buro_bueno"
  ],
  "recent_transactions": [
    {
      "fecha": "2025-10-01",
      "comercio": "Spotify",
      "monto": 99.0,
      "categoria": "servicios_digitales",
      "tipo": "cargo_recurrente"
    }
  ],
  "trigger_active": {
    "trigger_id": "T06",
    "name": "Inversión desaprovechada",
    "opening_message": "Hola 👋 Vi que tienes $12,000 en tu cuenta sin generar rendimiento...",
    "ctas": ["Ver inversión Hey", "Simular rendimiento", "Ahora no"],
    "pet_skin": "cat_orange"
  }
}

Response 404: { "detail": "Usuario no encontrado" }
Response 401: { "detail": "Token requerido" }
```

---

## GET /chat/open?user_id=

```
Query:   ?user_id=USR-00042
Headers: Authorization: Bearer <token>

Response 200:
{
  "trigger_id": "T06",
  "opening_message": "Hola 👋 Vi que tienes $12,000 en tu cuenta sin generar rendimiento. Con Hey Inversiones podrías ganar aprox. $96/mes. ¿Lo exploramos?",
  "ctas": ["Ver inversión Hey", "Simular rendimiento", "Ahora no"],
  "pet_skin": "cat_orange"
}
```

---

## POST /chat/message

```
Headers: Authorization: Bearer <token>

Request:
{
  "user_id": "USR-00042",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Cuéntame más sobre la inversión"
}

Response 200:
{
  "reply": "Claro, con Hey Inversiones tu dinero genera un rendimiento anual...",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## POST /admin/reload

```
Response 200: { "status": "reloaded" }
```
Sin autenticación — solo para desarrollo local.

---

## Tabla de triggers y pet_skins

| trigger_id | Nombre                    | pet_skin    |
|-----------|---------------------------|-------------|
| T01       | Pago fallido reciente     | cat_purple  |
| T02       | Suscripciones dormidas    | cat_green   |
| T03       | Oportunidad Hey Pro       | cat_orange  |
| T04       | Crédito latente           | cat_orange  |
| T05       | Gasto inusual detectado   | cat_purple  |
| T06       | Inversión desaprovechada  | cat_orange  |
| T07       | Patrón de educación       | cat_green   |
| T08       | Inactividad de app        | cat_gray    |
