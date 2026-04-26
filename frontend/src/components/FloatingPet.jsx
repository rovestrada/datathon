import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// ─── vscode-pets state machine ────────────────────────────────────────────────
const S = {
  SIT_IDLE:   'sit-idle',
  WALK_RIGHT: 'walk-right',
  WALK_LEFT:  'walk-left',
  RUN_RIGHT:  'run-right',
  RUN_LEFT:   'run-left',
  CLIMB_WALL: 'climb-wall',
  WALL_HANG:  'wall-hang',
  JUMP_DOWN:  'jump-down',
  LAND:       'land',
}

const SEQUENCE = {
  [S.SIT_IDLE]:   [S.WALK_RIGHT, S.RUN_RIGHT],
  [S.WALK_RIGHT]: [S.WALK_LEFT,  S.RUN_LEFT],
  [S.RUN_RIGHT]:  [S.WALK_LEFT,  S.RUN_LEFT],
  [S.WALK_LEFT]:  [S.SIT_IDLE, S.CLIMB_WALL, S.WALK_RIGHT, S.RUN_RIGHT],
  [S.RUN_LEFT]:   [S.SIT_IDLE, S.CLIMB_WALL, S.WALK_RIGHT, S.RUN_RIGHT],
  [S.CLIMB_WALL]: [S.WALL_HANG],
  [S.WALL_HANG]:  [S.JUMP_DOWN],
  [S.JUMP_DOWN]:  [S.LAND],
  [S.LAND]:       [S.SIT_IDLE, S.WALK_RIGHT, S.RUN_RIGHT],
}

const HOLD = {
  [S.SIT_IDLE]:   50,
  [S.WALK_RIGHT]: 60,
  [S.WALK_LEFT]:  60,
  [S.RUN_RIGHT]:  130,
  [S.RUN_LEFT]:   130,
  [S.CLIMB_WALL]: 28,
  [S.WALL_HANG]:  30,
  [S.JUMP_DOWN]:  20,
  [S.LAND]:       10,
}

const WALK_SPEED  = 2.2
const RUN_SPEED   = WALK_SPEED * 1.6
const CLIMB_SPEED = 1.4
const CLIMB_MAX   = 120
const FALL_SPEED  = 5
const FLOOR       = 24

function pickNext(state) {
  const opts = SEQUENCE[state]
  return opts[Math.floor(Math.random() * opts.length)]
}

// ─── Pixel art sprite system ──────────────────────────────────────────────────
// Grid: 12 cols × variable rows at 4 px per logical pixel
// Keys: B=body  D=dark/paw  E=eye  N=nose  .=transparent
const PX = 4

// Pixel maps — each string must be exactly 12 characters wide
const MAPS = {
  // Sitting, front-facing
  idle: [
    '..B.....B...',  // 0  ear tips
    '..BB...BB...',  // 1  ears
    '..BBBBBBBB..',  // 2  head top
    '..BEBBBBEB..',  // 3  eyes (cols 3 & 8)
    '..BBBBBBBB..',  // 4  head mid
    '..BBBBNBBB..',  // 5  nose (col 7)
    '..BBBBBBBB..',  // 6  chin
    '...BBBBBB...',  // 7  neck
    '..BBBBBBBB..',  // 8  body
    '..BBBBBBBB..',  // 9
    '..BBBBBBBB..',  // 10
    '.DD......DD.',  // 11 paws
    '.DD......DD.',  // 12
  ],

  // Side-profile walking — legs position A (extended)
  walkA: [
    '..BBB.......',  // 0  head top
    '.BBBBB......',  // 1  head
    '.BEBB.......',  // 2  eye (col 2)
    '.BBNBBBBB...',  // 3  nose + body start
    '.BBBBBBBBB..',  // 4  body
    '.BBBBBBBBBBD',  // 5  body + tail tip (col 11)
    '.BBBBBBBBB..',  // 6  body bottom
    '....D...D...',  // 7  legs A — front/back extended
    '....D...D...',  // 8
    '...DD...DD..',  // 9  feet
  ],

  // Side-profile walking — legs position B (swapped)
  walkB: [
    '..BBB.......',
    '.BBBBB......',
    '.BEBB.......',
    '.BBNBBBBB...',
    '.BBBBBBBBB..',
    '.BBBBBBBBBBD',
    '.BBBBBBBBB..',
    '...D.....D..',  // 7  legs B
    '..DD.....DD.',  // 8
    '..D.......D.',  // 9
  ],

  // Running — exaggerated legs A
  runA: [
    '.BBB........',  // 0  head forward
    'BBBBB.......',  // 1
    'BEBB........',  // 2  eye
    'BBNBBBBBBB..',  // 3  wide body
    '.BBBBBBBBBB.',  // 4
    '.BBBBBBBBBBД',  // 5  (just use B for tail area)
    '.BBBBBBBBBB.',  // 6
    '.....D..D...',  // 7  legs stretched
    '....DD..DD..',  // 8
    '...D.....D..',  // 9
  ],

  // Running — exaggerated legs B
  runB: [
    '.BBB........',
    'BBBBB.......',
    'BEBB........',
    'BBNBBBBBBB..',
    '.BBBBBBBBBB.',
    '.BBBBBBBBBB.',
    '.BBBBBBBBBB.',
    '...D.....D..',
    '..DD.....DD.',
    '..D.......D.',
  ],

  // Climbing wall (vertical body, facing left)
  climb: [
    '......BBB...',  // 0
    '.....BBBBB..',  // 1
    '.....BEBB...',  // 2
    '.....BBNB...',  // 3
    'BBD..BBBBB..',  // 4  front claws extended left
    'BBD..BBBBB..',  // 5
    '.....BBBBB..',  // 6
    '.....BBBBB..',  // 7
    '.....BBB....',  // 8
    '......B.....',  // 9  tail hangs
    '......B.....',  // 10
    '......D.....',  // 11
  ],

  // Landing / crouching
  land: [
    '.BB.....BB..',  // 0  ears
    '.BBB...BBB..',  // 1
    '.BBBBBBBBBB.',  // 2  head
    '.BEBBBBBBEB.',  // 3  eyes
    '.BBBBBBBBBB.',  // 4
    '.BBBBNBBBBB.',  // 5  nose
    '.BBBBBBBBBB.',  // 6
    'BBBBBBBBBBBB',  // 7  squished wide body
    'BBBBBBBBBBBB',  // 8
    'DD........DD',  // 9  splayed paws
  ],
}

// ─── Pixel renderer ───────────────────────────────────────────────────────────
function colorFor(char, hovered) {
  if (char === '.' || char === 'Д') return null  // Д is a typo placeholder, treat as transparent
  const body = hovered ? '#00ff88' : '#c4c4c4'
  const dark = hovered ? '#00cc70' : '#888888'
  switch (char) {
    case 'B': return body
    case 'D': return dark
    case 'E': return '#2a2a2a'
    case 'N': return '#e899b0'
    default:  return null
  }
}

function PixelSprite({ map, hovered }) {
  const cols = map[0]?.length ?? 12
  const rows = map.length
  const rects = []

  map.forEach((row, y) => {
    ;[...row].forEach((char, x) => {
      const fill = colorFor(char, hovered)
      if (fill) {
        rects.push(
          <rect key={`${x}-${y}`} x={x * PX} y={y * PX} width={PX} height={PX} fill={fill} />
        )
      }
    })
  })

  return (
    <svg
      width={cols * PX}
      height={rows * PX}
      viewBox={`0 0 ${cols * PX} ${rows * PX}`}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', display: 'block' }}
      aria-hidden="true"
    >
      {rects}
    </svg>
  )
}

// ─── Notification messages ────────────────────────────────────────────────────
const NOTIFICATIONS = [
  '¡Hola! ¿Necesitas ayuda con tus finanzas?',
  'Tengo un consejo financiero para ti 💡',
  '¿Dudas? Estoy aquí para ayudarte',
  'Revisa tus gastos recientes',
  '¿Quieres transferir dinero? Pregúntame cómo',
]

// ─── FloatingPet ─────────────────────────────────────────────────────────────
const FloatingPet = memo(function FloatingPet({ onOpenChat }) {
  // Render-driving state only
  const [render, setRender] = useState({
    map: MAPS.idle, facing: 'right', leftPx: 24, bottomPx: FLOOR,
  })
  const [hovered,  setHovered]  = useState(false)
  const [tooltip,  setTooltip]  = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)

  // Mutable game state kept in a ref — never causes re-renders
  const gs = useRef({
    state: S.SIT_IDLE, leftPx: 24, bottomPx: FLOOR,
    counter: 0, walkFrame: 0,
  })
  // Hover ref — read inside the game loop without stale closure issues
  const hoveredRef = useRef(false)

  // 8 fps game loop (mirrors vscode-pets nextFrame)
  useEffect(() => {
    const tick = setInterval(() => {
      // Pause all movement while the user hovers over the pet
      if (hoveredRef.current) return

      const g = gs.current
      const maxRight = window.innerWidth - 48 - 24
      let done   = false
      let facing = render.facing
      let map    = MAPS.idle

      g.counter++
      g.walkFrame = (g.walkFrame + 1) % 8

      switch (g.state) {
        case S.SIT_IDLE:
          map = MAPS.idle
          if (g.counter >= HOLD[S.SIT_IDLE]) done = true
          break

        case S.WALK_RIGHT:
          g.leftPx += WALK_SPEED; facing = 'right'
          map = g.walkFrame < 4 ? MAPS.walkA : MAPS.walkB
          if (g.leftPx >= maxRight) { g.leftPx = maxRight; done = true }
          else if (g.counter >= HOLD[S.WALK_RIGHT]) done = true
          break

        case S.WALK_LEFT:
          g.leftPx -= WALK_SPEED; facing = 'left'
          map = g.walkFrame < 4 ? MAPS.walkA : MAPS.walkB
          if (g.leftPx <= 0) { g.leftPx = 0; done = true }
          else if (g.counter >= HOLD[S.WALK_LEFT]) done = true
          break

        case S.RUN_RIGHT:
          g.leftPx += RUN_SPEED; facing = 'right'
          map = g.walkFrame < 4 ? MAPS.runA : MAPS.runB
          if (g.leftPx >= maxRight) { g.leftPx = maxRight; done = true }
          else if (g.counter >= HOLD[S.RUN_RIGHT]) done = true
          break

        case S.RUN_LEFT:
          g.leftPx -= RUN_SPEED; facing = 'left'
          map = g.walkFrame < 4 ? MAPS.runA : MAPS.runB
          if (g.leftPx <= 0) { g.leftPx = 0; done = true }
          else if (g.counter >= HOLD[S.RUN_LEFT]) done = true
          break

        case S.CLIMB_WALL:
          g.bottomPx += CLIMB_SPEED; facing = 'left'
          map = MAPS.climb
          if (g.bottomPx >= FLOOR + CLIMB_MAX) { g.bottomPx = FLOOR + CLIMB_MAX; done = true }
          break

        case S.WALL_HANG:
          map = MAPS.climb
          if (g.counter >= HOLD[S.WALL_HANG]) done = true
          break

        case S.JUMP_DOWN:
          g.bottomPx -= FALL_SPEED; map = MAPS.climb
          if (g.bottomPx <= FLOOR) { g.bottomPx = FLOOR; done = true }
          break

        case S.LAND:
          map = MAPS.land
          if (g.counter >= HOLD[S.LAND]) done = true
          break
      }

      if (done) {
        g.state   = pickNext(g.state)
        g.counter = 0
      }

      setRender({ map, facing, leftPx: g.leftPx, bottomPx: g.bottomPx })
    }, 125) // 8 fps

    return () => clearInterval(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Notification every 30-40 s
  useEffect(() => {
    const schedule = () => {
      const delay = 30000 + Math.random() * 10000
      return setTimeout(() => {
        setMsgIndex(i => (i + 1) % NOTIFICATIONS.length)
        setTooltip(true)
        setTimeout(() => setTooltip(false), 5000)
        timer = schedule()
      }, delay)
    }
    let timer = schedule()
    return () => clearTimeout(timer)
  }, [])

  const handleClick = useCallback(() => {
    setTooltip(false)
    onOpenChat()
  }, [onOpenChat])

  const { map, facing, leftPx, bottomPx } = render
  // Mirror sprite horizontally when facing left — same as vscode-pets scaleX(-1)
  const scaleX = facing === 'left' ? -1 : 1

  return (
    <div
      style={{
        position: 'fixed',
        left:     `${leftPx}px`,
        bottom:   `${bottomPx}px`,
        zIndex:   50,
        userSelect: 'none',
        // CSS transition between 8fps ticks → smooth motion
        transition: 'left 0.12s linear, bottom 0.12s linear',
      }}
      aria-label="Mascota HAVI"
    >
      {/* Speech bubble tooltip — mirrors vscode-pets .bubble */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, y: 6, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.88 }}
            transition={{ duration: 0.15 }}
            style={{
              position:     'absolute',
              bottom:       '60px',
              left:         '50%',
              transform:    'translateX(-50%)',
              background:   '#fff',
              color:        '#333',
              border:       '2px solid #333',
              borderRadius: '10px',
              padding:      '8px 10px',
              fontSize:     '10px',
              fontFamily:   'monospace',
              minWidth:     '130px',
              maxWidth:     '190px',
              textAlign:    'center',
              lineHeight:   '1.4em',
              whiteSpace:   'normal',
              pointerEvents: 'none',
              // vscode-pets uses a silkscreen font; monospace approximates it
            }}
          >
            {NOTIFICATIONS[msgIndex]}
            {/* Bubble tail (matches .bubble:before / :after) */}
            <span style={{
              position:    'absolute',
              bottom:      '-10px',
              left:        '12px',
              width:       0, height: 0,
              borderTop:   '7px solid #333',
              borderRight: '7px solid transparent',
              borderLeft:  '7px solid transparent',
            }} />
            <span style={{
              position:    'absolute',
              bottom:      '-6px',
              left:        '14px',
              width:       0, height: 0,
              borderTop:   '5px solid #fff',
              borderRight: '5px solid transparent',
              borderLeft:  '5px solid transparent',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sprite button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => { setHovered(true); hoveredRef.current = true; setTooltip(false) }}
        onMouseLeave={() => { setHovered(false); hoveredRef.current = false }}
        style={{
          background:  'transparent',
          border:      'none',
          padding:     0,
          cursor:      'pointer',
          display:     'block',
          // Direction flip — identical to vscode-pets img.pet transform
          transform:   `scaleX(${scaleX}) scale(${hovered ? 1.15 : 1})`,
          transition:  'transform 0.12s ease',
          outline:     'none',
          filter:      hovered ? 'drop-shadow(0 0 6px rgba(0,255,136,0.6))' : 'none',
          // Pixelated rendering — matches vscode-pets sprite GIFs
          imageRendering: 'pixelated',
        }}
        aria-label="Abrir asistente HAVI"
      >
        <PixelSprite map={map} hovered={hovered} />
      </button>
    </div>
  )
})

export default FloatingPet

// ─── State machine (mirrors vscode-pets cat sequence) ─────────────────────────
