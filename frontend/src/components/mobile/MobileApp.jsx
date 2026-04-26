import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, CreditCard, ArrowLeftRight, Inbox } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePet } from '../../context/PetContext'
import { useScreen } from '../../context/ScreenContext'

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

export default function MobileApp() {
  const { isAuthenticated, customerId, token, chatOpenData } = useAuth()
  const { petEnabled, petType, petVariant, applyArchetypeDefault } = usePet()
  const { navigateTo, cacheScreenData, screenCache } = useScreen()
  const [screen, setScreen] = useState('inicio')
  const [prevScreen, setPrevScreen] = useState(null)
  const [petPaused, setPetPaused] = useState(false)
  const [petX, setPetX] = useState(40)
  const [petFacingR, setPetFacingR] = useState(true)

  const handlePetMove = (data) => {
    // Si data es un objeto (v2), extraemos campos. Si es solo número (compat), actualizamos solo X.
    if (typeof data === 'object') {
      setPetX(data.x)
      setPetFacingR(data.facingR)
    } else {
      setPetX(data)
    }
  }

  // Cuando llega el perfil tras el login (vía chatOpenData), aplicar mascota default
  useEffect(() => {
    if (chatOpenData?.archetype_name) {
      applyArchetypeDefault(chatOpenData.archetype_name)
    }
  }, [chatOpenData, applyArchetypeDefault])

  // Pause pet whenever entering a free screen; bubble dismiss will unpause
  useEffect(() => {
    if (FREE_SCREENS.includes(screen)) {
      setPetPaused(true)
      // H05: En salud y estado, la bubble aparece sola tras 1.5s (unpausing pet triggers it)
      if (screen === 'salud' || screen === 'estado' || screen === 'cards') {
        const t = setTimeout(() => setPetPaused(false), 1500)
        return () => clearTimeout(t)
      }
    } else {
      setPetPaused(false)
    }
  }, [screen])

  // Cargar datos de la pantalla desde el backend
  const loadScreenData = async (screenId) => {
    const apiId = SCREEN_API_MAP[screenId] ?? screenId
    if (screenCache[apiId]) return
    try {
      const res = await fetch(`/api/screen/${apiId}?user_id=${customerId}`, {
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
          {screen === 'inicio'     && <MobileHome customerId={customerId} onGoToSettings={() => goTo('ajustes')} onGoToHealth={() => goTo('salud')} onGoToStatement={() => goTo('estado')} />}
          {screen === 'pagos'      && <MobilePagos onBack={goBack} />}
          {screen === 'transferir' && <MobileTransferir customerId={customerId} onBack={goBack} />}
          {screen === 'buzon'      && <MobileBuzon onBack={goBack} />}
          {screen === 'cards'      && <MobileCards onBack={goBack} />}
          {screen === 'havi'       && <MobileHAVI customerId={customerId} token={token} chatOpenData={chatOpenData} onBack={goBack} onNavigate={goTo} />}
          {screen === 'ajustes'    && <MobileSettings onBack={goBack} onNavigate={goTo} />}
          {screen === 'salud'      && <MobileFinancialHealth onBack={goBack} onOpenHAVI={() => goTo('havi')} />}
          {screen === 'estado'     && <MobileStatement onBack={goBack} onOpenHAVI={() => goTo('havi')} />}
          {screen === 'mascota'    && <MobilePetCustomization onBack={goBack} />}
          {screen === 'profile'    && <MobileProfile onBack={goBack} />}
        </motion.div>
      </AnimatePresence>

      {/* HAVI suggestion bubble */}
      {showBubble && (
        <HaviBubble
          screen={screen}
          onOpenHAVI={() => goTo('havi')}
          bottomOffset={isNavScreen ? '88px' : '82px'}
          thoughtBubble={thoughtBubble && petEnabled}
          onDismiss={isFreeScreen ? () => setPetPaused(false) : undefined}
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
          paused={isFreeScreen && petPaused}
          onPress={() => goTo('havi')}
          onPositionChange={handlePetMove}
        />
      )}

      {/* HAVI corner logo when pet is disabled on non-home sections */}
      {showHAVICorner && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => goTo('havi')}
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
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', letterSpacing: '0.5px' }}>HAVI</span>
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
