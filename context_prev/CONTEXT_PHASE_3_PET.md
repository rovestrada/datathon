# CONTEXT_PHASE_3_PET.md — Mascota PetSprite

> Lee CONTEXT.md global antes de este archivo.
> Prerequisito: Fase 2 completada. AppShell tiene los placeholders de PetSprite y SpeechBubble.
> Esta fase tarda ~4 horas. Trabaja en `frontend/src/components/` y `frontend/public/pets/`.

---

## Objetivo de esta fase

Reemplazar los dos placeholders de la Fase 2 (`PetSprite` y `SpeechBubble`) con
implementaciones reales. Al terminar:

- Un sprite pixel-art camina de izquierda a derecha sobre la navbar, rebota en los bordes,
  hace idle ocasionalmente.
- La apariencia del sprite cambia según `pet_skin` (viene del trigger del usuario logueado).
- Al hacer click, aparece un speech bubble estilizado con el `opening_message`.
- El speech bubble tiene el texto y un hint visual de que es clickeable para abrir el chat.

---

## P01 — Obtener los assets

Abre una terminal y ejecuta desde la raíz del proyecto:

```bash
git clone --depth=1 https://github.com/tonybaloney/vscode-pets.git _vscode_pets_tmp

# Copiar los GIFs del gato (son los más completos y expresivos)
mkdir -p frontend/public/pets/cat_orange
mkdir -p frontend/public/pets/cat_purple
mkdir -p frontend/public/pets/cat_green
mkdir -p frontend/public/pets/cat_gray

# Los GIFs están en _vscode_pets_tmp/media/cat/
# Busca los archivos: *_walk*.gif, *_idle*.gif, *_sit*.gif
# El naming varía por versión — explora la carpeta y copia los que correspondan.
# Si hay variantes de color, usa: orange → cat_orange, etc.
# Si no hay todos los colores, usa el mismo GIF base para todos los skins
# y diferéncialos luego con un filtro CSS (ver P03).

cp _vscode_pets_tmp/media/cat/*walk*.gif  frontend/public/pets/cat_gray/walk.gif   2>/dev/null || true
cp _vscode_pets_tmp/media/cat/*idle*.gif  frontend/public/pets/cat_gray/idle.gif   2>/dev/null || true
cp _vscode_pets_tmp/media/cat/*sit*.gif   frontend/public/pets/cat_gray/sit.gif    2>/dev/null || true

# Copia a los demás skins (mismo GIF, el color se aplica via CSS en P03)
for skin in cat_orange cat_purple cat_green; do
  cp frontend/public/pets/cat_gray/walk.gif frontend/public/pets/$skin/walk.gif
  cp frontend/public/pets/cat_gray/idle.gif frontend/public/pets/$skin/idle.gif
  cp frontend/public/pets/cat_gray/sit.gif  frontend/public/pets/$skin/sit.gif
done

rm -rf _vscode_pets_tmp
```

**Si el clone falla o los GIFs no están donde se espera**, usa cualquier sprite pixel-art
de gato en GIF (hay muchos en itch.io con licencia libre). Lo que importa es tener
al menos `walk.gif` e `idle.gif` en cada carpeta de skin.

**Verificar que los GIFs cargan en el browser:**
Abre `http://localhost:5173/pets/cat_gray/walk.gif` — debe verse la animación.

---

## P02 — Componente PetSprite (lógica de movimiento)

**`frontend/src/components/PetSprite.jsx`**:

```jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './PetSprite.module.css'

const SPEED = 0.8          // píxeles por frame
const PET_W = 40           // ancho del sprite en px
const IDLE_CHANCE = 0.002  // probabilidad por frame de pasar a idle
const IDLE_FRAMES = 120    // frames que dura el estado idle (~2s a 60fps)

export default function PetSprite({ petSkin = 'cat_gray', onPetClick }) {
  const [pos, setPos]       = useState(60)          // posición X en px
  const [dir, setDir]       = useState(1)           // 1 = derecha, -1 = izquierda
  const [anim, setAnim]     = useState('walk')      // 'walk' | 'idle' | 'sit'
  const idleCountRef        = useRef(0)
  const containerRef        = useRef(null)
  const rafRef              = useRef(null)

  const gifSrc = `/pets/${petSkin}/${anim}.gif`

  const tick = useCallback(() => {
    setPos(x => {
      const container = containerRef.current
      const maxX = container ? container.offsetWidth - PET_W : 340

      if (anim === 'idle') {
        idleCountRef.current += 1
        if (idleCountRef.current > IDLE_FRAMES) {
          idleCountRef.current = 0
          setAnim('walk')
        }
        return x
      }

      // Lógica de walk
      let next = x + SPEED * dir
      let newDir = dir

      if (next <= 0) { next = 0; newDir = 1; setDir(1) }
      if (next >= maxX) { next = maxX; newDir = -1; setDir(-1) }

      // Cambio aleatorio a idle
      if (Math.random() < IDLE_CHANCE) {
        setAnim('idle')
        idleCountRef.current = 0
      }

      return next
    })

    rafRef.current = requestAnimationFrame(tick)
  }, [dir, anim])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  const flipStyle = dir === -1 ? { transform: 'scaleX(-1)' } : {}

  return (
    <div ref={containerRef} className={styles.container}>
      <img
        src={gifSrc}
        alt="mascota Havi"
        className={`${styles.pet} ${styles[petSkin]}`}
        style={{ left: pos, ...flipStyle, pointerEvents: 'all', cursor: 'pointer' }}
        onClick={onPetClick}
        width={PET_W}
        height={PET_W}
        draggable={false}
      />
    </div>
  )
}
```

**`frontend/src/components/PetSprite.module.css`**:
```css
.container { position: absolute; inset: 0; overflow: hidden; }
.pet { position: absolute; bottom: 2px; image-rendering: pixelated; transition: filter .5s ease; user-select: none; }

/* Filtros CSS para diferenciar skins cuando los GIFs son el mismo base */
.cat_orange { filter: hue-rotate(0deg) saturate(1.4); }
.cat_purple { filter: hue-rotate(200deg) saturate(1.2); }
.cat_green  { filter: hue-rotate(100deg) saturate(1.2); }
.cat_gray   { filter: grayscale(0.6); }
```

---

## P03 — Animación de entrada al hacer login

Al hacer el primer render (cuando el componente monta), la mascota debe entrar desde
el borde derecho corriendo. Para esto, inicializa `pos` al ancho del contenedor y
el `dir` en -1 (corriendo hacia la izquierda). Después de 2 segundos, mostrar
el SpeechBubble automáticamente.

Agrega este efecto al principio del componente PetSprite:

```jsx
// Entrada desde la derecha al montar
const [entered, setEntered] = useState(false)
useEffect(() => {
  const t = setTimeout(() => setEntered(true), 2000)
  return () => clearTimeout(t)
}, [])
```

Pasa `entered` como prop al AppShell via un callback `onEntered` para que AppShell
muestre el SpeechBubble automáticamente al completar la entrada. Alternativamente,
maneja el SpeechBubble auto-show directamente en AppShell con un `setTimeout` de 2500ms
después del login.

**Implementación recomendada en AppShell (más simple):**
```jsx
// En AuthContext login(), después de cargar chatOpen:
// El SpeechBubble se muestra automáticamente 2.5s después del login

// En AppShell:
const [autoShowBubble, setAutoShowBubble] = useState(false)
useEffect(() => {
  if (chatOpen) {
    const t = setTimeout(() => setAutoShowBubble(true), 2500)
    return () => clearTimeout(t)
  }
}, [chatOpen])
// usar autoShowBubble || bubbleVisible para mostrar el SpeechBubble
```

---

## P04 — Componente SpeechBubble real

Reemplaza el placeholder con la implementación real.

**`frontend/src/components/SpeechBubble.jsx`**:

```jsx
import styles from './SpeechBubble.module.css'

export default function SpeechBubble({ message, onClick }) {
  return (
    <div className={styles.bubble} onClick={onClick} role="button" tabIndex={0}>
      <p className={styles.text}>{message}</p>
      <span className={styles.hint}>Toca para hablar con Havi →</span>
      {/* Cola del bubble apuntando hacia abajo-derecha donde está la mascota */}
      <div className={styles.tail} />
    </div>
  )
}
```

**`frontend/src/components/SpeechBubble.module.css`**:
```css
.bubble {
  position: absolute;
  bottom: 52px;
  right: 8px;
  max-width: 230px;
  min-width: 160px;
  background: var(--hb-white);
  border: 1.5px solid var(--hb-orange);
  border-radius: 14px 14px 4px 14px;
  padding: 10px 14px 8px;
  cursor: pointer;
  pointer-events: all;
  box-shadow: 0 4px 16px rgba(255,107,0,.15);
  animation: pop .2s cubic-bezier(.34,1.56,.64,1);
}
.text { font-size: 13px; color: var(--hb-text); line-height: 1.45; margin-bottom: 4px; }
.hint { font-size: 11px; color: var(--hb-orange); font-weight: 500; }
.tail {
  position: absolute;
  bottom: -9px;
  right: 52px;
  width: 0; height: 0;
  border-left: 8px solid transparent;
  border-right: 0px solid transparent;
  border-top: 9px solid var(--hb-orange);
}
@keyframes pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
```

---

## Checklist de salida de esta fase

- [ ] El GIF de la mascota se ve caminando sobre la navbar (no el placeholder naranja)
- [ ] La mascota rebota en ambos extremos de la pantalla
- [ ] La mascota hace idle ocasionalmente
- [ ] Cambiar de usuario en el login cambia el filtro CSS de la mascota (skin distinto)
- [ ] Al hacer login, la mascota entra corriendo desde el borde derecho
- [ ] Después de ~2.5s, el SpeechBubble aparece automáticamente con animación pop
- [ ] El SpeechBubble muestra el `opening_message` del usuario logueado
- [ ] Al hacer click en la mascota, el SpeechBubble aparece/desaparece
- [ ] Al hacer click en el SpeechBubble, se abre HaviChat (el placeholder de fase 4)
- [ ] El SpeechBubble tiene la cola apuntando hacia la mascota

---

## Lo que NO hacer en esta fase

- No implementar múltiples mascotas simultáneas — una sola es suficiente para el demo.
- No usar Canvas API para el movimiento — el approach con `requestAnimationFrame` + `left` CSS
  es más simple y suficiente para 60fps.
- No intentar reutilizar el código TypeScript de vscode-pets — solo los GIFs.
- No agregar física compleja (gravedad, colisiones) — el tiempo no lo justifica.
