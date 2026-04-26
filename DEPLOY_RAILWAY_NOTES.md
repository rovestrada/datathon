# Deploy Railway Notes

## Backend

- Actualicé los loaders para que usen `api/mock` como ubicación principal de datos mock.
- Dejé fallback a la ruta antigua `mock/` para compatibilidad local.
- Ajusté el comando de Railway del backend:
  - Antes: `uvicorn api.main:app`
  - Ahora: `uvicorn main:app`
- Verifiqué que el backend carga correctamente:
  - `10` perfiles desde `api/mock/user_profiles.json`
  - `78` estados de pantalla desde `api/mock/screen_data`

## Frontend

- Confirmé que el build local funciona con:

```bash
npm run build
```

- El deploy inicial falló porque Railway usaba Node `18.20.5`, incompatible con Vite 8.
- Luego Railway eligió Node `22.11.0`, también incompatible porque Vite requiere `22.12+`.
- Agregué configuración Docker para fijar Node `22.14`.

Archivos agregados:

```text
frontend/Dockerfile
frontend/.dockerignore
```

Archivos modificados:

```text
frontend/package.json
frontend/package-lock.json
frontend/railway.json
```

## Railway

Servicios creados/desplegados:

```text
havi-api
havi-frontend
```

Variables configuradas:

```text
VITE_API_URL=https://havi-api-production.up.railway.app
ALLOWED_ORIGINS=https://havi-frontend-production.up.railway.app
```

URLs finales:

```text
Frontend: https://havi-frontend-production.up.railway.app
API:      https://havi-api-production.up.railway.app
```

## Verificacion

Backend:

```bash
curl https://havi-api-production.up.railway.app/health
```

Respuesta:

```json
{"status":"ok","environment":"production"}
```

Frontend:

```bash
curl -I https://havi-frontend-production.up.railway.app
```

Resultado:

```text
HTTP/2 200
```

## Estado Final

- Backend en Railway: `SUCCESS`
- Frontend en Railway: `SUCCESS`
- Frontend responde publicamente con `200 OK`
- API responde publicamente con healthcheck correcto
- Mock data ya se consume desde `api/mock`
