# TEST_PHASE1.md — Testing del Backend API
## Havi Proactivo · Fase 1

> Corre estos tests antes de avanzar a la Fase 2.
> Prerequisito: servidor corriendo en `localhost:8000`.
> Todos los ejemplos usan `curl` y `python3` — no necesitas instalar nada extra.

---

## Arrancar el servidor

```bash
# Desde la carpeta api
cd api
uvicorn main:app --reload --port 8000
```
# Verificar que arrancó correctamente — debe ver en los logs:
# [loader] 5 perfiles cargados desde '../mock/user_profiles.json'
# INFO:     Application startup complete.
```

---

## Referencia rápida: usuarios y tokens de prueba

Estos tokens son base64 del user_id. Son estáticos — no cambian a menos que
cambie el user_id.

| user_id | password | token (para header Authorization) | trigger | pet_skin |
|---------|----------|-----------------------------------|---------|---------|
| USR-00042 | demo | `VVNSLTAwMDQy` | T06 | cat_orange |
| USR-00101 | demo | `VVNSLTAwMTAx` | T03 | cat_orange |
| USR-00207 | demo | `VVNSLTAwMjA3` | T01 | cat_purple |
| USR-00315 | demo | `VVNSLTAwMzE1` | T08 | cat_gray |
| USR-00489 | demo | `VVNSLTAwNDg5` | T02 | cat_green |

---

## TEST-01 — Healthcheck

Verifica que el servidor está vivo y los perfiles cargaron.

```bash
curl -s http://localhost:8000/health
```

**Respuesta esperada:**
```json
{"status": "ok"}
```

---

## TEST-02 — Login exitoso

```bash
curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USR-00042", "password": "demo"}'
```

---

## TEST-05 — Perfil de usuario completo

```bash
curl -s http://localhost:8000/user/profile/USR-00042 \
  -H "Authorization: Bearer VVNSLTAwMDQy"
```

---

## TEST-09 — Chat open: trigger y skin del usuario

```bash
curl -s "http://localhost:8000/chat/open?user_id=USR-00042" \
  -H "Authorization: Bearer VVNSLTAwMDQy"
```

---

## TEST-13 — Continuidad de sesión en el chat

> Verifica que Havi recuerda lo que se dijo antes en la misma sesión.
> Requiere ANTHROPIC_API_KEY en api/.env.

```bash
SESSION="sesion-continuidad-$(date +%s)"

# Turno 1
echo "=== Turno 1 ==="
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VVNSLTAwMDQy" \
  -d "{\"user_id\":\"USR-00042\",\"session_id\":\"$SESSION\",\"message\":\"Ver inversión Hey\"}" \
  | python3 -c "import sys,json; print('Havi:', json.load(sys.stdin)['reply'][:100])"

# Turno 2 — pregunta de seguimiento, Havi debe recordar el contexto
echo ""
echo "=== Turno 2 ==="
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VVNSLTAwMDQy" \
  -d "{\"user_id\":\"USR-00042\",\"session_id\":\"$SESSION\",\"message\":\"¿Y si quiero retirar el dinero antes?\"}" \
  | python3 -c "import sys,json; print('Havi:', json.load(sys.stdin)['reply'][:100])"
```

---

## TEST-16 — Suite automática completa (sin Claude API)

Ejecuta este bloque desde la raíz del proyecto (`.`):

```bash
python3 << 'EOF'
import sys
import os

# 1. Agregamos la carpeta 'api' al inicio del path para que Python encuentre 'routers', 'main', etc.
sys.path.insert(0, os.path.abspath('api'))

# 2. Importamos sin el prefijo 'api.' (esto es lo que fallaba antes)
import services.profile_loader as pl
# La ruta al mock es relativa a la raíz donde se corre este script
pl.load_profiles('mock/user_profiles.json')

from main import app
from fastapi.testclient import TestClient

client = TestClient(app)
results = []

def assert_(cond, msg='assertion failed'):
    if not cond: raise AssertionError(msg)

def test(name, fn):
    try:
        fn()
        results.append(('PASS', name))
    except AssertionError as e:
        results.append(('FAIL', f'{name} — {e}'))
    except Exception as e:
        results.append(('ERROR', f'{name} — {type(e).__name__}: {e}'))

# ── Ejecución de los Tests ───────────────────────────────────────────────────
test('T01 GET /health', lambda: 
    assert_(client.get('/health').status_code == 200))

test('T02 POST /auth/login válido', lambda:
    assert_(client.post('/auth/login', json={'user_id':'USR-00042','password':'demo'}).status_code == 200))

test('T03 Token correcto', lambda:
    assert_(client.post('/auth/login', json={'user_id':'USR-00042','password':'demo'}).json()['token'] == 'VVNSLTAwMDQy'))

test('T04 GET /user/profile', lambda:
    assert_(client.get('/user/profile/USR-00042', headers={'Authorization': 'Bearer VVNSLTAwMDQy'}).status_code == 200))

test('T05 GET /chat/open', lambda:
    assert_(client.get('/chat/open?user_id=USR-00042', headers={'Authorization': 'Bearer VVNSLTAwMDQy'}).status_code == 200))

# ── Reporte Final ────────────────────────────────────────────────────────────
passed = sum(1 for s, _ in results if s == 'PASS')
print('\n' + '━' * 56)
print(f'  RESULTADOS FASE 1 — {passed}/{len(results)} tests pasaron')
print('━' * 56)
for status, name in results:
    icon = {'PASS': '✓', 'FAIL': '✗', 'ERROR': '⚡'}[status]
    print(f"  {icon} {name}")
print('━' * 56)
EOF
```

---

## Problemas frecuentes

**`ModuleNotFoundError: No module named 'api'`**
Este error en los tests automáticos se corrigió añadiendo la carpeta `api/` al PATH de Python dinámicamente en el script del TEST-16.

**`FileNotFoundError: ../mock/user_profiles.json`**
Asegúrate de ejecutar `uvicorn` desde la carpeta `api/`. Si lo ejecutas desde la raíz, el servidor no encontrará el archivo mock.
