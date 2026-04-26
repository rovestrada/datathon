# CONTEXT_PHASE_5_POLISH.md — Polish & Pitch

> Lee CONTEXT.md global antes de este archivo.
> Prerequisito: Fases 1–4 completadas. Demo funciona end-to-end.
> Esta fase tarda ~3 horas. Trabaja en todo el codebase.
> A partir de aquí: CERO features nuevas. Solo pulir lo que existe.

---

## Objetivo de esta fase

Que el demo se vea y sienta como una app real durante los 8–10 minutos del pitch.
Tres cosas en orden de prioridad:

1. **Que no rompa** durante la presentación (bug fixes críticos).
2. **Que el momento WOW funcione** (cambio de usuario → mascota cambia → mensaje diferente).
3. **Que se vea profesional** (branding, tipografía, spacing consistente).

---

## D01 — Selección y validación de los 5 usuarios demo

Antes de cualquier polish visual, verifica que los 5 usuarios del pitch funcionen
correctamente end-to-end. Para cada uno:

```
USR-00042 → T06 Inversión desaprovechada → cat_orange
USR-00101 → T03 Oportunidad Hey Pro      → cat_orange
USR-00207 → T01 Pago fallido reciente    → cat_purple
USR-00315 → T08 Inactividad de app       → cat_gray
USR-00489 → T02 Suscripciones dormidas   → cat_green
```

Checklist para cada usuario:
- [ ] Login con demo/demo no lanza error
- [ ] La mascota aparece con el skin correcto
- [ ] El opening_message es específico y menciona datos reales del usuario
- [ ] Los 3 CTAs del trigger aparecen
- [ ] Al enviar el primer CTA, Havi responde con contexto
- [ ] La conversación libre funciona (2–3 turnos mínimo)

Si algún usuario falla, arrégla el `user_profiles.json` antes de continuar.

---

## D02 — Branding y tipografía

### Fuente Inter
Agregar en `frontend/index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Logo Hey Banco
Si no tienes el logo oficial, usa texto estilizado consistente en toda la app:
```html
<!-- Texto logo en naranja, peso 700 -->
<span style="color: var(--hb-orange); font-weight: 700; font-size: 1.4rem;">hey banco</span>
```

### Íconos de la navbar
Reemplaza los textos planos de los tabs por íconos simples.
Usa lucide-react (ya está disponible en el CDN sin instalar nada en React+Vite):
```bash
cd frontend && npm install lucide-react
```
```jsx
import { Home, List, CreditCard, User } from 'lucide-react'
// Usar en cada tab: <Home size={20} /> con label debajo
```

### Revisión de consistencia visual
Recorre todas las pantallas y verifica:
- Todos los textos usan la paleta definida en CONTEXT.md (no hay grises hardcodeados).
- Todos los border-radius son 8px, 10px o 16px (no mezclar valores arbitrarios).
- El spacing interno de cards y secciones es consistente (múltiplos de 4px).
- No hay texto desbordado o cortado en mobile (prueba en 375px de ancho).

---

## D03 — Panel "Under the Hood" para el pitch

Este panel es opcional pero **muy recomendable** para el pitch. Lo muestra el presentador
para explicar "cómo funciona la magia detrás".

Agregar un tab oculto en la Home que se activa con doble-click en el logo o con un
query param `?debug=1`:

**`frontend/src/components/ProfileDebugPanel.jsx`**:

```jsx
import { useEffect, useState } from 'react'
import { userAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import styles from './ProfileDebugPanel.module.css'

export default function ProfileDebugPanel() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (user) userAPI.getProfile(user.user_id).then(r => setProfile(r.data))
  }, [user])

  if (!profile) return null

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Motor ML — perfil del usuario</h3>

      <div className={styles.row}>
        <span className={styles.label}>Arquetipo</span>
        <span className={styles.value}>{profile.archetype_name}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Cluster ID</span>
        <span className={styles.value}>#{profile.cluster_id}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Anomaly score</span>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{width: `${profile.anomaly_score * 100}%`,
            background: profile.anomaly_score > 0.7 ? '#dc2626' : profile.anomaly_score > 0.4 ? '#f59e0b' : '#16a34a'}} />
        </div>
        <span className={styles.value}>{(profile.anomaly_score * 100).toFixed(0)}%</span>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Características detectadas</span>
        <div className={styles.tags}>
          {profile.top_features.map(f => (
            <span key={f} className={styles.tag}>{f.replace(/_/g, ' ')}</span>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Trigger activo</span>
        <div className={styles.trigger}>
          <span className={styles.triggerId}>{profile.trigger_active.trigger_id}</span>
          <span className={styles.triggerName}>{profile.trigger_active.name}</span>
          <span className={styles.petSkin}>skin: {profile.trigger_active.pet_skin}</span>
        </div>
      </div>
    </div>
  )
}
```

**`frontend/src/components/ProfileDebugPanel.module.css`**:
```css
.panel { background: var(--hb-white); border: 1px solid var(--hb-border); border-radius: 12px; padding: 1rem; margin: 1rem; }
.title { font-size: 13px; font-weight: 600; color: var(--hb-text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: .75rem; }
.row { display: flex; align-items: center; gap: 8px; margin-bottom: .5rem; }
.label { font-size: 12px; color: var(--hb-text-muted); min-width: 120px; }
.value { font-size: 13px; font-weight: 500; color: var(--hb-text); }
.barTrack { flex: 1; height: 6px; background: var(--hb-border); border-radius: 3px; overflow: hidden; }
.barFill { height: 100%; border-radius: 3px; transition: width .4s; }
.section { margin-top: .75rem; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.tag { font-size: 11px; padding: 2px 8px; background: var(--hb-orange-lt); color: var(--hb-orange); border-radius: 20px; }
.trigger { display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
.triggerId { font-size: 12px; font-weight: 700; color: var(--hb-purple); }
.triggerName { font-size: 13px; color: var(--hb-text); }
.petSkin { font-size: 11px; color: var(--hb-text-muted); font-family: monospace; }
```

**Activar el panel en Home.jsx:**
```jsx
import { useSearchParams } from 'react-router-dom'
import ProfileDebugPanel from '../components/ProfileDebugPanel'

// Dentro de Home:
const [params] = useSearchParams()
const debugMode = params.get('debug') === '1'

// En el JSX:
{debugMode && <ProfileDebugPanel />}
```

Para el pitch, abrir la URL con `?debug=1` para mostrar el panel.

---

## D04 — Script del demo

Guardar en `demo_script.md` en la raíz:

```markdown
# Script demo — Havi Proactivo

Duración total: 8–10 minutos
Estructura: 3 min pitch → 4 min demo en vivo → 1 min roadmap

## Usuario 1: USR-00207 (Pago fallido — cat_purple)
"Imagina que Mario tuvo un pago rechazado anoche. Esta mañana abre su app..."
→ Login con USR-00207
→ La mascota aparece en MORADO (alerta)
→ Speech bubble: mensaje de pago fallido
→ Click → Chat → CTA "Activar alerta de saldo"
→ Havi explica cómo funciona la alerta

## Usuario 2: USR-00042 (Inversión — cat_orange)
"Ahora veamos a Sofía, que tiene $12,000 sin generar rendimiento..."
→ Logout → Login con USR-00042
→ La mascota CAMBIA DE COLOR a naranja
→ Speech bubble diferente, oportunidad de inversión
→ CTA "Simular rendimiento" → Havi calcula rendimiento estimado

## Usuario 3: USR-00489 (Suscripciones — cat_green)
"Y Carlos, que paga 3 suscripciones que ya no usa..."
→ Logout → Login con USR-00489
→ Mascota VERDE
→ Mostrar panel debug (?debug=1) para explicar el motor ML
→ "Esto es lo que el modelo detectó automáticamente, sin reglas manuales"

## Cierre
"Tres usuarios, tres realidades distintas, Havi ya las conocía antes de que ellos preguntaran."
```

---

## D05 — Ensayo final

Dos ensayos completos antes de la presentación:

1. **Ensayo técnico:** Verificar que los 3 usuarios del script funcionan sin errores.
   Tener el backend corriendo en una terminal aparte. Verificar que la API key de
   Anthropic tiene crédito. Tener el wifi verificado o correr todo local.

2. **Ensayo narrativo:** Medir el tiempo. Si supera 10 minutos, recortar a 2 usuarios
   en el demo. El pitch debe poder sobrevivir sin internet (tener respuestas cacheadas
   o el mock hardcodeado en el frontend como fallback).

**Fallback si el backend falla durante el pitch:**
Agrega en `api.js` un fallback local si el request tarda más de 5s:
```js
// En chatAPI.message:
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 5000)
try {
  const res = await http.post('/chat/message', body, { signal: controller.signal })
  return res
} catch {
  return { data: { reply: 'Claro, con gusto te ayudo con eso. [demo mode]', session_id } }
} finally {
  clearTimeout(timeout)
}
```

---

## Checklist de salida de esta fase (= checklist final del proyecto)

- [ ] Los 3 usuarios del script de demo funcionan sin errores end-to-end
- [ ] El cambio de usuario cambia visiblemente el skin de la mascota
- [ ] El panel debug muestra el perfil ML correctamente con `?debug=1`
- [ ] La fuente Inter está cargando en todos los navegadores
- [ ] No hay warnings de consola visibles durante el demo
- [ ] El backend tiene la API key de Anthropic configurada y con crédito
- [ ] El script de demo está memorizado o impreso
- [ ] El pitch deck está listo y tiene el diagrama de arquitectura
- [ ] Se hicieron 2 ensayos cronometrados
- [ ] Hay un fallback preparado si el API de Claude no responde
