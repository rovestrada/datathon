import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, CreditCard, ArrowLeftRight, Inbox } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePet } from '../../context/PetContext'
import { useScreen } from '../../context/ScreenContext'
import { API_BASE } from '../../utils/apiConfig'

import MobileLogin from './MobileLogin'
import MobileHome from './MobileHome'
import MobileHAVI from './MobileHAVI'
import MobileSettings from './MobileSettings'
import { MobilePagos, MobileTransferir, MobileBuzon, MobileCards, MobileProfile } from './MobileScreens'
import MobileFinancialHealth from './MobileFinancialHealth'
import MobileStatement from './MobileStatement'
import MobilePetCustomization from './MobilePetCustomization'
import HaviBubble from './HaviBubble'
import NavPet from './NavPet'
import HaviLogo from '../HaviLogo'

// Map from Spanish nav screen names to English API/cache keys
const SCREEN_API_MAP = {
  inicio: 'home',
  salud: 'health',
  estado: 'statement',
  pagos: 'payments',
  buzon: 'inbox',
  cards: 'cards',
  transferir: 'transfers',
}

// Screens that hide bottom nav AND the pet
const FULL_SCREENS = ['havi', 'ajustes', 'mascota']
// Screens that show the bottom nav bar
const NAV_SCREENS  = ['inicio', 'pagos', 'transferir', 'buzon']
// Screens with no nav, no full-screen modal (pet walks at actual bottom)
const FREE_SCREENS = ['salud', 'estado', 'cards']

// CONFIGURABLE: Screens where the pet is allowed to appear
const PET_SCREENS = [
  'inicio', 'pagos', 'transferir', 'buzon', 
  'salud', 'estado', 'cards'
]

const NAV_TABS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'pagos',  label: 'Pagos',  icon: CreditCard },
  { id: 'transferir', label: 'Transferir', icon: ArrowLeftRight },
  { id: 'buzon',  label: 'Buzón',  icon: Inbox, badge: 3 },
]

// Random notification messages for the pet
const PET_NOTIFICATIONS = [
  '¡Hola! ¿Necesitas ayuda con tus finanzas?',
  'Tengo un consejo financiero para ti 💡',
  '¿Dudas? Estoy aquí para ayudarte',
  'Revisa tus gastos recientes',
  '¿Quieres transferir dinero? Pregúntame cómo',
  '¡No olvides revisar tu Buzón! 📬',
]

export default function MobileApp() {
  const { isAuthenticated, customerId, userName, token, chatOpenData } = useAuth()
  const { petEnabled, petType, petVariant, applyArchetypeDefault } = usePet()
  const { navigateTo, cacheScreenData, screenCache } = useScreen()
  const [screen, setScreen] = useState('inicio')
  const [prevScreen, setPrevScreen] = useState(null)
  const [petPaused, setPetPaused] = useState(false)
  const [petX, setPetX] = useState(40)
  const [petFacingR, setPetFacingR] = useState(true)
  const [notification, setNotification] = useState(null)
  const [notifMsgIdx, setNotifMsgIdx] = useState(0)

  const handlePetMove = (data) => {
    // Si data es un objeto (v2), extraemos campos. Si es solo número (compat), actualizamos solo X.
    if (typeof data === 'object') {
      setPetX(data.x)
      setPetFacingR(data.facingR)
    } else {
      setPetX(data)
    }
  }

  const dismissNotification = () => setNotification(null)

  // Cuando llega el perfil tras el login (vía chatOpenData), aplicar mascota default
  useEffect(() => {
    if (chatOpenData?.archetype_name) {
      applyArchetypeDefault(chatOpenData.archetype_name, customerId)
    }
  }, [chatOpenData, customerId, applyArchetypeDefault])

  // Dismiss any active notification when screen changes
  useEffect(() => { setNotification(null) }, [screen])

  // Schedule periodic pet notifications (only on non-full screens)
  useEffect(() => {
    if (!isAuthenticated) return
    let mainTimer
    let dismissTimer

    const schedule = () => {
      const delay = 30000 + Math.random() * 10000
      mainTimer = setTimeout(() => {
        setNotifMsgIdx(i => {
          const next = (i + 1) % PET_NOTIFICATIONS.length
          setNotification(PET_NOTIFICATIONS[next])
          return next
        })
        dismissTimer = setTimeout(() => setNotification(null), 5000)
        schedule()
      }, delay)
    }

    schedule()
    return () => {
      clearTimeout(mainTimer)
      clearTimeout(dismissTimer)
    }
  }, [isAuthenticated])

  // Pause pet whenever entering a free screen; bubble dismiss will unpause
  useEffect(() => {
    if (FREE_SCREENS.includes(screen)) {
      setPetPaused(true)
    } else {
      setPetPaused(false)
    }
  }, [screen])

  // Cargar datos de la pantalla desde el backend
  const loadScreenData = async (screenId) => {
    const apiId = SCREEN_API_MAP[screenId] ?? screenId
    if (screenCache[apiId]) return
    try {
      const res = await fetch(`${API_BASE}/screen/${apiId}?user_id=${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) cacheScreenData(apiId, await res.json())
    } catch (e) {
      console.warn(`Error cargando screen:${apiId}`, e)
    }
  }

  useEffect(() => {
    if (isAuthenticated && customerId && token) {
      loadScreenData(screen)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, customerId, token, screen])

  const goTo = (s) => { 
    setPrevScreen(screen)
    setScreen(s)
    navigateTo(s) 
    loadScreenData(s)
  }
  const goBack = () => { 
    const s = prevScreen || 'inicio'
    setScreen(s)
    setPrevScreen(null)
    navigateTo(s)
    loadScreenData(s)
  }

  // Visibility logic
  const isNavScreen   = NAV_SCREENS.includes(screen)    // has bottom nav bar
  const isFullScreen  = FULL_SCREENS.includes(screen)   // no pet, no nav
  const isFreeScreen  = FREE_SCREENS.includes(screen)   // salud / estado
  const showBottomNav = isNavScreen
  // Pet visible according to configurable list
  const showPet        = petEnabled && PET_SCREENS.includes(screen)
  const petNavVisible  = isNavScreen             // Sit above nav if nav is visible
  const showHAVICorner = !petEnabled && isFreeScreen
  const showBubble     = !isFullScreen
  const thoughtBubble  = isFreeScreen

  if (!isAuthenticated) {
    return <MobileLogin />
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#0a0a12',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
    }}>
      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {screen === 'inicio'     && <MobileHome customerId={customerId} onGoToSettings={() => goTo('ajustes')} onGoToHealth={() => goTo('salud')} onGoToStatement={() => goTo('estado')} onNavigate={goTo} />}
          {screen === 'pagos'      && <MobilePagos onBack={goBack} />}
          {screen === 'transferir' && <MobileTransferir customerId={customerId} onBack={goBack} />}
          {screen === 'buzon'      && <MobileBuzon onBack={goBack} />}
          {screen === 'cards'      && <MobileCards onBack={goBack} />}
          {screen === 'havi'       && <MobileHAVI customerId={customerId} userName={userName} token={token} chatOpenData={chatOpenData} petEnabled={petEnabled} petType={petType} petVariant={petVariant} onBack={goBack} onNavigate={goTo} />}
          {screen === 'ajustes'    && <MobileSettings onBack={goBack} onNavigate={goTo} />}
          {screen === 'salud'      && <MobileFinancialHealth onBack={goBack} onOpenHAVI={() => goTo('havi')} />}
          {screen === 'estado'     && <MobileStatement onBack={goBack} onOpenHAVI={() => goTo('havi')} />}
          {screen === 'mascota'    && <MobilePetCustomization onBack={goBack} />}
          {screen === 'profile'    && <MobileProfile onBack={goBack} />}
        </motion.div>
      </AnimatePresence>

      {/* HAVI suggestion bubble — hidden while a notification is active */}
      {showBubble && !notification && (
        <HaviBubble
          screen={screen}
          onOpenHAVI={() => goTo('havi')}
          bottomOffset={isNavScreen ? '88px' : '82px'}
          thoughtBubble={thoughtBubble && petEnabled}
          onShow={() => setPetPaused(true)}
          onDismiss={() => setPetPaused(false)}
          petX={petX}
          facingR={petFacingR}
        />
      )}

      {/* Pet — above nav on home; at actual screen bottom on secondary screens */}
      {showPet && (
        <NavPet
          petType={petType}
          petVariant={petVariant}
          navVisible={petNavVisible}
          paused={petPaused}
          notification={!showBottomNav ? notification : null}
          onNotificationDismiss={dismissNotification}
          onPress={() => { dismissNotification(); goTo('havi') }}
          onPositionChange={handlePetMove}
        />
      )}

      {/* Notification bubble anchored to center HAVI nav button (when nav visible + pet disabled) */}
      <AnimatePresence>
        {notification && showBottomNav && !isFullScreen && !petEnabled && (
          <motion.div
            key="notif-nav"
            initial={{ opacity: 0, y: 8, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.88 }}
            transition={{ duration: 0.15 }}
            onClick={() => { dismissNotification(); goTo('havi') }}
            style={{
              position:     'fixed',
              bottom:       '148px',
              left:         '50%',
              transform:    'translateX(-50%)',
              zIndex:       55,
              width:        '180px',
              background:   '#fff',
              color:        '#111',
              border:       '2px solid #111',
              borderRadius: '10px',
              padding:      '8px 10px',
              fontSize:     '11px',
              fontFamily:   '"Courier New", Courier, monospace',
              fontWeight:   'bold',
              textAlign:    'center',
              lineHeight:   '1.4',
              wordBreak:    'break-word',
              cursor:       'pointer',
            }}
          >
            {notification}
            {/* Tail pointing down toward HAVI button */}
            <span style={{
              position:    'absolute',
              bottom:      '-10px',
              left:        '50%',
              transform:   'translateX(-50%)',
              width:       0, height: 0,
              borderTop:   '8px solid #111',
              borderRight: '7px solid transparent',
              borderLeft:  '7px solid transparent',
            }} />
            <span style={{
              position:    'absolute',
              bottom:      '-6px',
              left:        '50%',
              transform:   'translateX(-50%)',
              width:       0, height: 0,
              borderTop:   '6px solid #fff',
              borderRight: '5px solid transparent',
              borderLeft:  '5px solid transparent',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HAVI corner logo when pet is disabled on non-home sections */}
      {showHAVICorner && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => { dismissNotification(); goTo('havi') }}
          style={{
            position: 'fixed', bottom: '20px', right: '16px',
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#1e1040',
            border: '2px solid #a78bfa66',
            cursor: 'pointer', zIndex: 45,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(167,139,250,0.25)',
          }}
          aria-label="Abrir HAVI"
        >
          <HaviLogo size={32} />
        </motion.button>
      )}

      {/* Notification bubble anchored to corner HAVI button (when pet disabled, no nav) */}
      <AnimatePresence>
        {notification && !petEnabled && !showBottomNav && !isFullScreen && (
          <motion.div
            key="notif-corner"
            initial={{ opacity: 0, x: 10, scale: 0.88 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.88 }}
            transition={{ duration: 0.15 }}
            onClick={() => { dismissNotification(); goTo('havi') }}
            style={{
              position:     'fixed',
              bottom:       '84px',
              right:        '16px',
              zIndex:       55,
              width:        '170px',
              background:   '#fff',
              color:        '#111',
              border:       '2px solid #111',
              borderRadius: '10px',
              padding:      '8px 10px',
              fontSize:     '11px',
              fontFamily:   '"Courier New", Courier, monospace',
              fontWeight:   'bold',
              textAlign:    'center',
              lineHeight:   '1.4',
              wordBreak:    'break-word',
              cursor:       'pointer',
            }}
          >
            {notification}
            {/* Tail pointing down-right toward corner button */}
            <span style={{
              position:    'absolute',
              bottom:      '-10px',
              right:       '18px',
              width:       0, height: 0,
              borderTop:   '8px solid #111',
              borderRight: '7px solid transparent',
              borderLeft:  '7px solid transparent',
            }} />
            <span style={{
              position:    'absolute',
              bottom:      '-6px',
              right:       '20px',
              width:       0, height: 0,
              borderTop:   '6px solid #fff',
              borderRight: '5px solid transparent',
              borderLeft:  '5px solid transparent',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav — on all 4 main tabs */}
      {showBottomNav && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: '#0d1022',
          borderTop: '1px solid #1a1a2a',
          display: 'flex', alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}>
          {/* Left 2 tabs */}
          {NAV_TABS.slice(0, 2).map(tab => (
            <NavTab key={tab.id} tab={tab} active={screen === tab.id} onPress={() => goTo(tab.id)} />
          ))}

          {/* Center HAVI button */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '6px 0 8px', position: 'relative' }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => goTo('havi')}
              style={{
                width: '58px', height: '58px', borderRadius: '50%',
                background: 'transparent',
                border: '3px solid transparent',
                backgroundImage: 'linear-gradient(#0d1022, #0d1022), linear-gradient(135deg, #7c3aed, #22d3ee, #a78bfa, #7c3aed)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative', top: '-10px',
              }}
              aria-label="HAVI"
            >
              {petEnabled ? (
                <img src="/Home.svg" width={26} height={26} alt="HAVI" style={{ filter: 'brightness(0) invert(1)', display: 'block' }} />
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', letterSpacing: '0.5px' }}>HAVI</span>
              )}
            </motion.button>
          </div>

          {/* Right 2 tabs */}
          {NAV_TABS.slice(2).map(tab => (
            <NavTab key={tab.id} tab={tab} active={screen === tab.id} onPress={() => goTo(tab.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function NavTab({ tab, active, onPress }) {
  const Icon = tab.icon
  return (
    <button
      onClick={onPress}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '3px', padding: '8px 0 8px',
        background: 'none', border: 'none', cursor: 'pointer',
        position: 'relative',
      }}
      aria-label={tab.label}
    >
      <div style={{ position: 'relative' }}>
        <Icon size={22} color={active ? '#a78bfa' : '#6b7280'} />
        {tab.badge && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-7px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#a78bfa', color: 'white',
            fontSize: '10px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {tab.badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: '10px', color: active ? '#a78bfa' : '#6b7280', fontWeight: active ? 600 : 400 }}>
        {tab.label}
      </span>
    </button>
  )
}
