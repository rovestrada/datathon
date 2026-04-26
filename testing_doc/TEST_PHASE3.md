# TEST_PHASE3.md — Testing de la Fase 3: Screen-Aware JSON & Backend
## Havi 360 · Hey Banco Hackathon

> Prerequisitos antes de empezar:
> - Fase 1 y Fase 2 pasando todos sus tests
> - Backend corriendo: `uvicorn api.main:app --reload --port 8000`
> - Frontend corriendo: `npm run dev` (localhost:5173)
> - DevTools del browser abiertos en Console + Network
> - Los 5 usuarios demo en `mock/user_profiles.json`
> - Al menos los 20 archivos mínimos en `mock/screen_data/` (4 pantallas × 5 usuarios)

---

## Mapa de tests por feature

| Feature | Tests | Herramienta |
|---------|-------|-------------|
| S01–S04 — Endpoint GET /screen | T01–T08 | curl / Python |
| S05–S06 — Chat con current_screen | T09–T15 | curl / Python |
| DS — Validación de screen_data JSONs | T16–T20 | Python |
| Frontend — Carga de screen data | T21–T25 | Browser DevTools |
| Integración completa | T26–T28 | Browser manual |

---

## Setup: limpiar e inicializar

```bash
# Terminal 1 — backend
cd havi-360
uvicorn api.main:app --reload --port 8000

# Verifica en los logs de arranque que aparezcan AMBAS líneas:
# [loader] 5 perfiles cargados desde 'mock/user_profiles.json'
# [screen_loader] N screen_data cargados     ← si dice 0, el directorio no existe aún
```

Si el servidor arranca con `[screen_loader] Directorio mock/screen_data no existe`,
los tests de backend (T01–T08) igual pueden correr — el endpoint devuelve fallback.
Los tests de contenido (T16–T20) necesitan los JSONs del equipo DS.

---

## S01–S04 — Endpoint GET /screen

### T01 — El endpoint existe y responde

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USR-00042","password":"demo"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s "http://localhost:8000/screen/home?user_id=USR-00042" \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado — con screen_data de DS disponible:**
```json
{
  "screen_id": "home",
  "user_id": "USR-00042",
  "havi_context": "El usuario está en inicio. Saldo disponible: $12,400...",
  "data": { "saldo_disponible": 12400.0, ... }
}
```

**Resultado esperado — sin screen_data (fallback):**
```json
{
  "screen_id": "home",
  "user_id": "USR-00042",
  "havi_context": "El usuario está en la sección home.",
  "data": {}
}
```

Ambos son válidos en este punto. Lo importante es que el endpoint responde 200
y tiene la estructura correcta.

---

### T02 — Los 4 campos obligatorios están presentes en todas las respuestas

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USR-00042","password":"demo"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

python3 << 'EOF'
import requests

TOKEN = "VVNSLTAwMDQy"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
BASE = "http://localhost:8000"
SCREENS = ["home", "health", "cards", "inbox", "payments", "transfer", "profile"]
REQUIRED_FIELDS = {"screen_id", "user_id", "havi_context", "data"}

errors = []
for screen in SCREENS:
    r = requests.get(f"{BASE}/screen/{screen}?user_id=USR-00042", headers=HEADERS)
    if r.status_code != 200:
        errors.append(f"GET /screen/{screen} → {r.status_code}")
        continue
    d = r.json()
    missing = REQUIRED_FIELDS - set(d.keys())
    if missing:
        errors.append(f"/screen/{screen}: faltan campos {missing}")
    if d.get("screen_id") != screen:
        errors.append(f"/screen/{screen}: screen_id={d.get('screen_id')} (esperado {screen})")
    if d.get("user_id") != "USR-00042":
        errors.append(f"/screen/{screen}: user_id={d.get('user_id')} (esperado USR-00042)")
    if not d.get("havi_context"):
        errors.append(f"/screen/{screen}: havi_context vacío")

if errors:
    for e in errors: print(f"  ✗ {e}")
else:
    print(f"  ✓ {len(SCREENS)} pantallas devuelven los 4 campos requeridos")
EOF
```

---

### T03 — Sin token devuelve 401

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:8000/screen/home?user_id=USR-00042"
# Esperado: 401
```

---

### T04 — Sin query param user_id devuelve 422

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:8000/screen/home" \
  -H "Authorization: Bearer VVNSLTAwMDQy"
# Esperado: 422
```

---

### T05 — Pantalla inexistente devuelve fallback (no 404)

```bash
curl -s "http://localhost:8000/screen/pantalla_que_no_existe?user_id=USR-00042" \
  -H "Authorization: Bearer VVNSLTAwMDQy" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('screen_id:', d['screen_id'])
print('havi_context:', d['havi_context'])
print('data vacío:', d['data'] == {})
assert d['screen_id'] == 'pantalla_que_no_existe', 'screen_id incorrecto'
assert d['data'] == {}, 'data debe ser {} en el fallback'
print('✓ Fallback correcto')
"
```

**Resultado esperado:** status 200 con `data: {}` y `havi_context` genérico.
El endpoint **no** devuelve 404 para pantallas sin datos — usa el fallback.

---

### T06 — Los 5 usuarios demo devuelven havi_context distinto para home

```python
python3 << 'EOF'
import requests, base64

BASE = "http://localhost:8000"
DEMO_USERS = ["USR-00042", "USR-00101", "USR-00207", "USR-00315", "USR-00489"]

contexts = {}
for uid in DEMO_USERS:
    tok = base64.b64encode(uid.encode()).decode()
    r = requests.get(f"{BASE}/screen/home?user_id={uid}",
                     headers={"Authorization": f"Bearer {tok}"})
    ctx = r.json().get("havi_context", "")
    contexts[uid] = ctx
    print(f"  {uid}: {ctx[:70]}...")

# Verificar que no son todos iguales (fallback genérico idéntico)
unique = len(set(contexts.values()))
if unique == 1:
    print("\n  ⚠ ADVERTENCIA: Todos los usuarios tienen el mismo havi_context.")
    print("    Puede ser el fallback genérico — verifica que DS entregó screen_data.")
elif unique == len(DEMO_USERS):
    print(f"\n  ✓ Los {len(DEMO_USERS)} usuarios tienen havi_context diferente")
else:
    print(f"\n  ~ {unique}/{len(DEMO_USERS)} havi_context únicos — algunos comparten contexto")
EOF
```

---

### T07 — /admin/reload recarga screen_data en caliente

```bash
# 1. Verificar cuántos screen_data hay antes
python3 << 'EOF'
import requests
r = requests.post("http://localhost:8000/admin/reload")
print("Reload status:", r.json())
# Revisa los logs del servidor — debe aparecer:
# [loader] 5 perfiles cargados desde 'mock/user_profiles.json'
# [screen_loader] N screen_data cargados
EOF
```

**En los logs del servidor** deben aparecer ambas líneas de carga. Si solo
aparece la de perfiles, `load_screen_data()` no fue agregado al `reload`.

---

### T08 — Suite automática completa del endpoint /screen

```python
python3 << 'EOF'
import sys
sys.path.insert(0, '.')

import api.services.profile_loader as pl
import api.services.screen_loader as sl
pl.load_profiles('mock/user_profiles.json')
sl.load_screen_data('mock/screen_data')

from fastapi.testclient import TestClient
from api.main import app
client = TestClient(app)

results = []

def assert_(c, msg=''):
    if not c: raise AssertionError(msg)

def test(name, fn):
    try:
        fn()
        results.append(('PASS', name))
    except Exception as e:
        results.append(('FAIL', f'{name} — {e}'))

TOKEN = 'VVNSLTAwMDQy'
HDR   = {'Authorization': f'Bearer {TOKEN}'}

# Endpoint existe
test('GET /screen/home → 200',
    lambda: assert_(client.get('/screen/home?user_id=USR-00042', headers=HDR).status_code == 200))

# Campos obligatorios
test('GET /screen/home → 4 campos requeridos', lambda: (
    d := client.get('/screen/home?user_id=USR-00042', headers=HDR).json(),
    assert_(d.get('screen_id') == 'home',       'screen_id'),
    assert_(d.get('user_id')   == 'USR-00042',  'user_id'),
    assert_(bool(d.get('havi_context')),         'havi_context vacío'),
    assert_('data' in d,                         'data ausente')))

# Auth
test('GET /screen sin token → 401',
    lambda: assert_(client.get('/screen/home?user_id=USR-00042').status_code == 401))
test('GET /screen sin user_id → 422',
    lambda: assert_(client.get('/screen/home', headers=HDR).status_code == 422))

# Fallback pantalla inexistente
test('GET /screen/nonexistent → 200 fallback', lambda: (
    d := client.get('/screen/nonexistent?user_id=USR-00042', headers=HDR).json(),
    assert_(d['screen_id'] == 'nonexistent', 'screen_id'),
    assert_(d['data'] == {},                 'data debe ser {}')))

# Todas las pantallas responden
for s in ['home','health','cards','inbox','payments','transfer','profile']:
    test(f'GET /screen/{s} → 200',
        lambda s=s: assert_(
            client.get(f'/screen/{s}?user_id=USR-00042', headers=HDR).status_code == 200))

# Admin reload
test('POST /admin/reload recarga screen_data',
    lambda: assert_(client.post('/admin/reload').json() == {'status': 'reloaded'}))

# Reporte
passed = sum(1 for s,_ in results if s == 'PASS')
print(f'\n{"━"*52}')
print(f'  GET /screen — {passed}/{len(results)} tests pasaron')
print(f'{"━"*52}')
for status, name in results:
    print(f'  {"✓" if status=="PASS" else "✗"} {name}')
print(f'{"━"*52}')
EOF
```

---

## S05–S06 — Chat con current_screen y navigation_action

### T09 — POST /chat/message acepta current_screen sin romper

```bash
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VVNSLTAwMDQy" \
  -d '{
    "user_id":       "USR-00042",
    "session_id":    "test-screen-001",
    "message":       "hola",
    "current_screen":"home"
  }' | python3 -c "
import sys,json; d=json.load(sys.stdin)
assert 'reply' in d,       'falta reply'
assert 'session_id' in d,  'falta session_id'
print('reply:', d['reply'][:80])
print('navigation_action:', d.get('navigation_action'))
print('✓ current_screen aceptado sin error')
"
```

**Si devuelve 422:** el schema `ChatMessageRequest` no tiene el campo
`current_screen` todavía. Agrégalo con `default="inicio"`.

---

### T10 — current_screen sin valor usa "inicio" por defecto (backward compat)

```bash
# Request SIN current_screen — la Fase 2 lo enviaba así
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VVNSLTAwMDQy" \
  -d '{
    "user_id":    "USR-00042",
    "session_id": "test-compat-001",
    "message":    "hola"
  }' | python3 -c "
import sys,json; d=json.load(sys.stdin)
assert d.get('reply'), 'sin reply — el endpoint se rompió con requests sin current_screen'
print('✓ Backward compatible — funciona sin current_screen')
print('reply:', d['reply'][:60])
"
```

**Este test es crítico.** La Fase 2 envía mensajes sin `current_screen`.
Si falla, el chat de Fase 2 se rompe con el cambio de Fase 3.

---

### T11 — La respuesta incluye el campo navigation_action (puede ser null)

```bash
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VVNSLTAwMDQy" \
  -d '{
    "user_id":       "USR-00042",
    "session_id":    "test-nav-check",
    "message":       "hola",
    "current_screen":"home"
  }' | python3 -c "
import sys,json; d=json.load(sys.stdin)
# navigation_action debe existir como campo (aunque sea null)
assert 'navigation_action' in d, 'navigation_action ausente del schema de respuesta'
print('navigation_action:', d['navigation_action'])
print('✓ Campo navigation_action presente en la respuesta')
"
```

---

### T12 — Intent de navegación genera navigation_action

Este test requiere `ANTHROPIC_API_KEY` configurada.

```bash
python3 << 'EOF'
import requests, time

BASE    = "http://localhost:8000"
TOKEN   = "VVNSLTAwMDQy"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

NAV_INTENTS = [
    ("quiero ver mis movimientos",      "estado"),
    ("muéstrame mis pagos pendientes",  "pagos"),
    ("quiero transferir dinero",        "transferir"),
    ("cómo está mi salud financiera",   "salud"),
    ("ver mis tarjetas",                "cards"),
]

print("Probando intents de navegación (requiere Claude API)...\n")
results = []
for i, (message, expected_screen) in enumerate(NAV_INTENTS):
    session_id = f"test-nav-{i}-{int(time.time())}"
    r = requests.post(f"{BASE}/chat/message", headers=HEADERS, json={
        "user_id":       "USR-00042",
        "session_id":    session_id,
        "message":       message,
        "current_screen":"home",
    })
    d = r.json()
    nav = d.get("navigation_action")
    got_screen = nav.get("screen") if nav else None
    ok = got_screen == expected_screen
    results.append(ok)
    icon = "✓" if ok else "~"
    print(f"  {icon} \"{message}\"")
    print(f"    esperado: {expected_screen} | recibido: {got_screen or 'null'}")
    if nav: print(f"    label: {nav.get('label')}")
    print()
    time.sleep(0.5)   # evitar rate limit

passed = sum(results)
print(f"Navegación inferida: {passed}/{len(results)} intents detectados correctamente")
if passed < len(results):
    print("Nota: Claude puede usar sinónimos de screen_id — revisa manualmente los ~")
EOF
```

**Resultado esperado:** al menos 3 de 5 intents devuelven `navigation_action`
con el screen correcto. Claude puede variar — lo importante es que el token
`[NAV:{...}]` está siendo extraído correctamente del texto de respuesta.

---

### T13 — El token [NAV:...] no aparece en el texto de la respuesta

Continuando el resultado de T12, verifica para cualquier respuesta que incluyó
`navigation_action`:

```bash
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VVNSLTAwMDQy" \
  -d '{
    "user_id":       "USR-00042",
    "session_id":    "test-nav-clean",
    "message":       "quiero ver mis movimientos",
    "current_screen":"home"
  }' | python3 -c "
import sys,json; d=json.load(sys.stdin)
reply = d.get('reply','')
nav   = d.get('navigation_action')
# El token [NAV:...] NO debe aparecer en el texto visible
assert '[NAV:' not in reply, f'[NAV:...] apareció en el texto de respuesta: {reply}'
print('reply:', reply[:100])
print('navigation_action:', nav)
print('✓ El token NAV fue extraído y no contamina el reply')
"
```

---

### T14 — El havi_context de la pantalla llega al system prompt

Este test verifica que cuando `current_screen=health`, el contexto de salud
financiera del usuario llega al model. Requiere API key.

```bash
curl -s -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VVNSLTAwMDQy" \
  -d '{
    "user_id":       "USR-00042",
    "session_id":    "test-ctx-health",
    "message":       "¿en qué me recomiendas enfocarme?",
    "current_screen":"health"
  }' | python3 -c "
import sys,json; d=json.load(sys.stdin)
reply = d.get('reply','').lower()
# Si el havi_context de health llegó al system prompt, la respuesta
# debe mencionar algo relacionado con finanzas, gastos o el score
keywords = ['gasto', 'crédito', 'ahorro', 'salud', 'financi', 'restaurante', 'saldo']
hits = [k for k in keywords if k in reply]
print('reply:', d['reply'][:150])
print('keywords encontradas:', hits)
if hits:
    print('✓ Respuesta contextual a la pantalla de salud financiera')
else:
    print('~ Respuesta genérica — verifica que havi_context de health está en el JSON')
"
```

---

### T15 — Suite automática POST /chat/message con current_screen

```python
python3 << 'EOF'
import sys
sys.path.insert(0, '.')

import api.services.profile_loader as pl
import api.services.screen_loader  as sl
pl.load_profiles('mock/user_profiles.json')
sl.load_screen_data('mock/screen_data')

from fastapi.testclient import TestClient
from api.main import app
client = TestClient(app)

results = []
def test(name, fn):
    try: fn(); results.append(('PASS', name))
    except Exception as e: results.append(('FAIL', f'{name} — {e}'))

TOKEN = 'VVNSLTAwMDQy'
HDR   = {'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}

# Acepta current_screen
test('POST /chat/message con current_screen → 200', lambda: (
    r := client.post('/chat/message', headers=HDR, json={
        'user_id':'USR-00042','session_id':'s1','message':'hola','current_screen':'home'}),
    (_ := None) if r.status_code == 200 else (_ for _ in ()).throw(AssertionError(f'status {r.status_code}'))))

# Backward compat sin current_screen
test('POST /chat/message SIN current_screen → 200 (backward compat)', lambda: (
    r := client.post('/chat/message', headers=HDR, json={
        'user_id':'USR-00042','session_id':'s2','message':'hola'}),
    (_ := None) if r.status_code == 200 else (_ for _ in ()).throw(AssertionError(f'status {r.status_code}'))))

# navigation_action en el schema de respuesta
test('Respuesta incluye campo navigation_action', lambda: (
    d := client.post('/chat/message', headers=HDR, json={
        'user_id':'USR-00042','session_id':'s3','message':'hola','current_screen':'home'}).json(),
    (_ := None) if 'navigation_action' in d else (_ for _ in ()).throw(AssertionError('falta navigation_action'))))

# [NAV:] no contamina el reply
test('[NAV:...] no aparece en el texto de respuesta', lambda: (
    d := client.post('/chat/message', headers=HDR, json={
        'user_id':'USR-00042','session_id':'s4','message':'test','current_screen':'home'}).json(),
    (_ := None) if '[NAV:' not in d.get('reply','') else (_ for _ in ()).throw(AssertionError('[NAV: encontrado en reply]'))))

# reply y session_id siguen presentes
test('reply y session_id presentes en respuesta', lambda: (
    d := client.post('/chat/message', headers=HDR, json={
        'user_id':'USR-00042','session_id':'s5','message':'hola','current_screen':'home'}).json(),
    (_ := None) if 'reply' in d and d.get('session_id') == 's5' else (_ for _ in ()).throw(AssertionError('reply o session_id faltante'))))

passed = sum(1 for s,_ in results if s=='PASS')
print(f'\n{"━"*52}')
print(f'  /chat/message Fase 3 — {passed}/{len(results)} tests')
print(f'{"━"*52}')
for s,n in results: print(f'  {"✓" if s=="PASS" else "✗"} {n}')
print(f'{"━"*52}')
EOF
```

---

## DS — Validación de screen_data JSONs

### T16 — Todos los archivos mínimos existen

```python
python3 << 'EOF'
import json
from pathlib import Path

DEMO_USERS      = ['USR-00042','USR-00101','USR-00207','USR-00315','USR-00489']
REQUIRED_SCREENS = ['home','health','cards','inbox']
SCREEN_DIR       = Path('mock/screen_data')

missing, found = [], []
for uid in DEMO_USERS:
    for s in REQUIRED_SCREENS:
        f = SCREEN_DIR / f'{uid}_{s}.json'
        (found if f.exists() else missing).append(f.name)

print(f'Archivos encontrados: {len(found)}/{len(DEMO_USERS)*len(REQUIRED_SCREENS)}')
if missing:
    for m in missing: print(f'  ✗ FALTA: {m}')
else:
    print('  ✓ Los 20 archivos mínimos están presentes')
EOF
```

---

### T17 — Todos los JSONs tienen esquema válido

```python
python3 << 'EOF'
import json
from pathlib import Path

SCREEN_DIR = Path('mock/screen_data')
errors = []

for f in sorted(SCREEN_DIR.glob('*.json')):
    try:
        d = json.loads(f.read_text(encoding='utf-8'))
    except json.JSONDecodeError as e:
        errors.append(f'{f.name}: JSON inválido — {e}'); continue

    uid = f.stem.split('_')[0] + '_' + f.stem.split('_')[1] if '_' in f.stem else '?'

    # Campos obligatorios
    for field in ['screen_id','user_id','havi_context','data']:
        if field not in d:
            errors.append(f'{f.name}: falta campo "{field}"')

    # havi_context no vacío
    if not d.get('havi_context','').strip():
        errors.append(f'{f.name}: havi_context vacío')

    # havi_context_short max 60 chars
    short = d.get('havi_context_short','')
    if short and len(short) > 60:
        errors.append(f'{f.name}: havi_context_short tiene {len(short)} chars (max 60)')

    # Nomenclatura correcta
    parts = f.stem.rsplit('_',1)
    if len(parts) == 2:
        expected_uid, expected_screen = parts[0], parts[1]
        if d.get('user_id') != expected_uid:
            errors.append(f'{f.name}: user_id={d.get("user_id")} no coincide con nombre del archivo')
        if d.get('screen_id') != expected_screen:
            errors.append(f'{f.name}: screen_id={d.get("screen_id")} no coincide con nombre del archivo')

total = len(list(SCREEN_DIR.glob('*.json')))
if errors:
    print(f'\n✗ {len(errors)} errores en {total} archivos:')
    for e in errors: print(f'  {e}')
else:
    print(f'✓ {total} archivos válidos')
EOF
```

---

### T18 — havi_context tiene datos reales (no es genérico)

```python
python3 << 'EOF'
import json
from pathlib import Path

SCREEN_DIR = Path('mock/screen_data')
GENERIC_PHRASES = [
    'el usuario está en la sección',
    'el usuario está en la pantalla',
    'en qué te ayudo',
    'sección home',
    'sección health',
]

warnings = []
for f in sorted(SCREEN_DIR.glob('*_home.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    ctx = d.get('havi_context','').lower()

    # Verificar que menciona al menos un dato numérico (saldo, %, días, etc.)
    has_number = any(c.isdigit() for c in ctx)
    is_generic = any(phrase in ctx for phrase in GENERIC_PHRASES)

    if not has_number:
        warnings.append(f'{f.name}: havi_context sin datos numéricos — parece genérico')
    if is_generic:
        warnings.append(f'{f.name}: havi_context parece el fallback genérico')
    if not warnings or warnings[-1].split(':')[0] != f.name:
        print(f'  ✓ {f.name}: "{ctx[:65]}..."')

if warnings:
    print('\n  Advertencias:')
    for w in warnings: print(f'  ⚠ {w}')
else:
    print(f'\n  ✓ Todos los havi_context de home contienen datos reales')
EOF
```

---

### T19 — Los havi_context de health mencionan métricas financieras

```python
python3 << 'EOF'
import json
from pathlib import Path

SCREEN_DIR = Path('mock/screen_data')
HEALTH_KEYWORDS = ['score', 'utiliz', 'crédito', 'rechazo', 'gasto', 'ahorro', 'días', 'pct', '%']

for f in sorted(SCREEN_DIR.glob('*_health.json')):
    d    = json.loads(f.read_text(encoding='utf-8'))
    ctx  = d.get('havi_context','').lower()
    hits = [k for k in HEALTH_KEYWORDS if k in ctx]
    icon = '✓' if len(hits) >= 2 else '⚠'
    print(f'  {icon} {f.name}: keywords encontradas: {hits}')
    if len(hits) < 2:
        print(f'    havi_context: "{ctx[:80]}..."')
        print(f'    Recomendación: incluir score financiero, utilización de crédito o días sin rechazo')
EOF
```

---

### T20 — Los screen_data de distintos usuarios son distintos entre sí

```python
python3 << 'EOF'
import json
from pathlib import Path

SCREEN_DIR = Path('mock/screen_data')

for screen in ['home','health','cards','inbox']:
    contexts = {}
    for f in sorted(SCREEN_DIR.glob(f'*_{screen}.json')):
        d = json.loads(f.read_text(encoding='utf-8'))
        contexts[f.stem] = d.get('havi_context','')

    if len(contexts) < 2:
        print(f'  ~ {screen}: menos de 2 archivos, no se puede comparar')
        continue

    unique = len(set(contexts.values()))
    icon = '✓' if unique == len(contexts) else '✗'
    print(f'  {icon} {screen}: {unique}/{len(contexts)} havi_context únicos')
    if unique < len(contexts):
        # Mostrar cuáles son iguales
        seen = {}
        for name, ctx in contexts.items():
            seen.setdefault(ctx, []).append(name)
        for ctx, names in seen.items():
            if len(names) > 1:
                print(f'    Idénticos: {names}')
                print(f'    Texto: "{ctx[:60]}..."')
EOF
```

---

## Frontend — Carga de screen data

### T21 — loadScreenData se llama al navegar

1. Abre DevTools → Network
2. Haz login con `USR-00042`
3. Navega a **Pagos** (toca el tab correspondiente)

**En Network verifica que aparece:**
```
GET /api/screen/pagos?user_id=USR-00042   → 200
```

4. Navega a **Salud Financiera**

```
GET /api/screen/salud?user_id=USR-00042   → 200
```

**Si no aparece ninguna llamada a `/api/screen/`:** `loadScreenData()` no está
siendo llamado en `goTo()` dentro de `MobileApp.jsx`.

---

### T22 — El caché evita llamadas duplicadas

1. Navega a Pagos (se carga por primera vez — aparece en Network)
2. Vuelve a Inicio
3. Vuelve a Pagos

**Resultado esperado:** en el paso 3 **no** aparece una segunda llamada a
`/api/screen/pagos` en Network. El cache de `ScreenContext` devuelve el valor
anterior sin hacer fetch.

**Si aparece la llamada de nuevo:** la condición `if (screenCache[screenId]) return`
no está funcionando, o `cacheScreenData` no está guardando correctamente.

---

### T23 — screenCache se popula correctamente en el contexto

Con React DevTools instalado, después de navegar por 3 pantallas distintas:

1. Abre React DevTools → Components
2. Busca el componente `ScreenProvider`
3. Revisa su state

**Resultado esperado en el state de ScreenProvider:**
```js
{
  currentScreen: "pagos",   // o la pantalla activa actual
  screenCache: {
    "inicio": { screen_id: "inicio", ... },
    "pagos":  { screen_id: "pagos", ... },
    "salud":  { screen_id: "salud", ... },
  },
  screenLoading: false
}
```

---

### T24 — currentScreen se actualiza en cada navegación

En la consola del browser, agrega temporalmente un watcher para verificar:

```js
// Pega esto en la consola para monitorear cambios de pantalla
// (funciona si ScreenContext expone currentScreen en el window,
// o puedes usar React DevTools para observar el estado)

// Alternativa: verificar en el Network que el screen_id del GET /api/screen/*
// coincide siempre con la pantalla a la que navegaste
```

Navega: Inicio → Pagos → Transferir → Inicio.

**En Network, verifica que la secuencia de GETs coincide exactamente:**
```
GET /api/screen/pagos      (al ir a Pagos)
GET /api/screen/transferir (al ir a Transferir)
                            (Inicio ya estaba en cache — no hay GET)
```

---

### T25 — Error de carga de screen data no rompe la navegación

1. Para el backend
2. Navega a una pantalla nueva (que no esté en caché)
3. Observa la consola del browser

**Resultado esperado:**
- Aparece un `console.warn` con el mensaje del error (no un error rojo)
- La pantalla **se renderiza de todas formas** — sin el screen_data, pero sin crash
- El usuario no ve ningún mensaje de error en la UI

Si la app se rompe: el `catch` en `loadScreenData` no está silenciando el error
graciosamente. Debe ser `console.warn(...)` no `console.error(...)` ni `throw`.

Reactiva el backend: `uvicorn api.main:app --reload --port 8000`

---

## Integración completa

### T26 — HAVI responde contextualmente según la pantalla activa

1. Login con `USR-00042`
2. Navega a **Salud Financiera**
3. Abre el chat de HAVI **desde esa pantalla**
4. Pregunta: *"¿en qué me recomiendas enfocarme?"*

**Resultado esperado:** HAVI menciona algo específico de la salud financiera
del usuario (score, gasto en restaurantes, utilización de crédito) — no una
respuesta genérica sobre finanzas.

5. Sin cerrar el chat, navega a **Transferir** (si el frontend lo permite)
6. Pregunta: *"¿cuánto puedo transferir hoy?"*

**Resultado esperado:** HAVI menciona el saldo disponible y el límite diario
de transferencia del usuario.

---

### T27 — Flujo completo de navegación por intent

1. Login con cualquier usuario demo
2. Abre el chat de HAVI (desde cualquier pantalla)
3. Escribe: *"quiero ver mis movimientos"*

**Resultado esperado:**
- HAVI responde con texto coherente
- Aparece un botón de navegación bajo el mensaje: *"Ver movimientos →"* (o similar)
- Al tocar el botón, la app navega a la pantalla de movimientos/estado

**Si el botón de navegación no aparece:** el frontend no está leyendo
`navigation_action` de la respuesta de `/api/chat/message`, o el backend
no está devolviendo el campo.

---

### T28 — Demo completo: 3 usuarios, 3 contextos distintos

Corre este flujo completo como si fuera el pitch:

**Usuario 1: USR-00207 (Pago fallido)**
1. Login → opening_message menciona el pago rechazado en Superama
2. Navega a **Movimientos/Estado**
3. Abre HAVI → pregunta: *"¿por qué falló mi pago?"*
4. HAVI responde con contexto del motivo de rechazo

**Usuario 2: USR-00042 (Inversión)**
1. Logout → Login → opening_message menciona la inversión desaprovechada
2. Navega a **Salud Financiera**
3. Abre HAVI → pregunta: *"¿cómo reduzco mi gasto?"*
4. HAVI responde con contexto de la pantalla de salud (distribución de gastos)

**Usuario 3: USR-00489 (Suscripciones)**
1. Logout → Login → opening_message menciona las suscripciones
2. Desde el chat de HAVI: *"quiero ver mis pagos"*
3. Aparece botón de navegación → al tocarlo va a Pagos

**Resultado esperado:** los 3 flujos funcionan sin errores de consola y con
respuestas de HAVI claramente distintas y contextuales a cada usuario y pantalla.

---

## Script de verificación rápida en browser

Ejecuta esto en la consola del browser **después de hacer login con USR-00042**:

```js
(async () => {
  const results = []
  const ok   = name => results.push({ ok: true,  name })
  const fail = (name, why) => results.push({ ok: false, name, why })

  const tok = sessionStorage.getItem('havi_token')
  const uid = sessionStorage.getItem('havi_customer_id')
  if (!tok || !uid) { console.error('Sin sesión activa — haz login primero'); return }
  const HDR = { Authorization: `Bearer ${tok}` }

  // GET /screen/home existe y tiene los 4 campos
  try {
    const r = await fetch(`/api/screen/home?user_id=${uid}`, { headers: HDR })
    const d = await r.json()
    r.ok ? ok('GET /screen/home → 200') : fail('GET /screen/home', `status ${r.status}`)
    ;['screen_id','user_id','havi_context','data'].every(f => f in d)
      ? ok('4 campos requeridos presentes')
      : fail('Campos requeridos', `faltan: ${['screen_id','user_id','havi_context','data'].filter(f=>!(f in d)).join(', ')}`)
    d.havi_context?.length > 20
      ? ok('havi_context no está vacío')
      : fail('havi_context', `muy corto o vacío: "${d.havi_context}"`)
  } catch(e) { fail('GET /screen/home', e.message) }

  // GET /screen sin auth → 401
  try {
    const r = await fetch(`/api/screen/home?user_id=${uid}`)
    r.status === 401
      ? ok('GET /screen sin token → 401')
      : fail('Auth requerida', `esperado 401, got ${r.status}`)
  } catch(e) { fail('GET /screen auth check', e.message) }

  // POST /chat/message acepta current_screen
  try {
    const r = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { ...HDR, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: uid, session_id: crypto.randomUUID(), message: 'hola', current_screen: 'home' })
    })
    const d = await r.json()
    r.ok ? ok('POST /chat/message con current_screen → 200') : fail('POST /chat/message', `status ${r.status}`)
    'navigation_action' in d
      ? ok('Campo navigation_action en respuesta')
      : fail('navigation_action', 'ausente del schema de respuesta')
    !d.reply?.includes('[NAV:')
      ? ok('[NAV:] no contamina el reply')
      : fail('[NAV:] en reply', `"${d.reply?.substring(0, 60)}"`)
  } catch(e) { fail('POST /chat/message', e.message) }

  // Backward compat sin current_screen
  try {
    const r = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { ...HDR, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: uid, session_id: crypto.randomUUID(), message: 'hola' })
    })
    r.ok
      ? ok('POST /chat/message SIN current_screen → backward compat OK')
      : fail('Backward compat', `status ${r.status} — se rompió la Fase 2`)
  } catch(e) { fail('Backward compat', e.message) }

  // Reporte
  const passed = results.filter(r=>r.ok).length
  console.log(`\n${'━'.repeat(54)}`)
  console.log(`  FASE 3 — ${passed}/${results.length} checks pasaron`)
  console.log(`${'━'.repeat(54)}`)
  results.forEach(r => {
    if (r.ok) console.log(`  ✓ ${r.name}`)
    else console.error(`  ✗ ${r.name}${r.why ? ' — '+r.why : ''}`)
  })
  console.log(`${'━'.repeat(54)}`)
})()
```

---

## Checklist final de la Fase 3

```
── Backend: GET /screen ──────────────────────────────────────────────
[ ] T01: GET /screen/home?user_id=USR-00042 → 200 con los 4 campos
[ ] T02: Las 7 pantallas devuelven los 4 campos requeridos
[ ] T03: Sin token → 401
[ ] T04: Sin user_id → 422
[ ] T05: Pantalla inexistente → 200 fallback con data:{}
[ ] T06: Los 5 usuarios demo tienen havi_context diferente para home
[ ] T07: POST /admin/reload recarga los screen_data en los logs
[ ] T08: Suite automática Python — todos los tests pasan

── Backend: chat con current_screen ──────────────────────────────────
[ ] T09: POST /chat/message acepta current_screen sin error 422
[ ] T10: Sin current_screen sigue funcionando (backward compat Fase 2)
[ ] T11: La respuesta incluye el campo navigation_action (puede ser null)
[ ] T12: Intents de navegación generan navigation_action correcto
[ ] T13: El token [NAV:...] no aparece en el texto del reply
[ ] T14: havi_context de la pantalla llega al system prompt de Claude
[ ] T15: Suite automática Python — todos los tests pasan

── DS: validación de screen_data JSONs ────────────────────────────────
[ ] T16: Los 20 archivos mínimos (4 pantallas × 5 usuarios) existen
[ ] T17: Todos los JSONs tienen esquema válido y campos requeridos
[ ] T18: havi_context de home tiene datos numéricos reales
[ ] T19: havi_context de health menciona métricas financieras
[ ] T20: havi_context distintos entre usuarios para la misma pantalla

── Frontend: carga de screen data ────────────────────────────────────
[ ] T21: Al navegar a una pantalla, aparece GET /api/screen/* en Network
[ ] T22: La segunda visita a la misma pantalla NO hace otro fetch (caché)
[ ] T23: screenCache en React DevTools tiene las pantallas visitadas
[ ] T24: currentScreen coincide con la pantalla activa al navegar
[ ] T25: Error de red en screen data no rompe la navegación

── Integración completa ───────────────────────────────────────────────
[ ] T26: HAVI responde con contexto de la pantalla activa
[ ] T27: Intent de navegación genera botón que lleva a la pantalla correcta
[ ] T28: Demo de 3 usuarios con 3 contextos distintos funciona end-to-end
[ ] Script pre-commit en browser — todos los checks muestran ✓
```

---

## Problemas frecuentes

**`[screen_loader] Directorio mock/screen_data no existe`**
El equipo de DS no ha entregado los JSONs todavía. El backend funciona con
fallback — los tests T01–T15 deben pasar igual. Los tests T16–T20 requieren
los archivos de DS.

**`422 Unprocessable Entity` en POST /chat/message con current_screen**
El campo `current_screen` no fue agregado al schema `ChatMessageRequest`.
Agrégalo con `current_screen: str = "inicio"` (con default para backward compat).

**`navigation_action` ausente de la respuesta**
El schema `ChatMessageResponse` no fue actualizado con el campo opcional.
Agrégalo como `navigation_action: NavigationAction | None = None`.

**El botón de navegación no aparece en el frontend aunque el backend devuelve navigation_action**
El componente `MobileHAVI` no está leyendo `data.navigation_action` de la
respuesta de `/api/chat/message`. Verifica el handler de `sendMessage`.

**havi_context genérico para todos los usuarios**
El equipo DS generó los JSONs con el fallback (`"El usuario está en la sección home."`)
en lugar de datos reales. Ejecutar T18/T19 para confirmarlo y pedirle a DS que
regenere los archivos con `build_havi_context()` del CONTEXT_DS_v2.md.
