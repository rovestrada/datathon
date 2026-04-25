import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, CreditCard, ArrowLeftRight, Inbox } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePet } from '../../context/PetContext'

import MobileLogin from './MobileLogin'
import MobileHome from './MobileHome'
import MobileHAVI from './MobileHAVI'
import MobileSettings from './MobileSettings'
import { MobilePagos, MobileTransferir, MobileBuzon } from './MobileScreens'
import MobileFinancialHealth from './MobileFinancialHealth'
import MobileStatement from './MobileStatement'
import MobilePetCustomization from './MobilePetCustomization'
import HaviBubble from './HaviBubble'
import NavPet from './NavPet'

// Screens that hide bottom nav AND the pet
const FULL_SCREENS = ['havi', 'ajustes', 'mascota']

const NAV_TABS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'pagos',  label: 'Pagos',  icon: CreditCard },
  { id: 'transferir', label: 'Transferir', icon: ArrowLeftRight },
  { id: 'buzon',  label: 'Buzón',  icon: Inbox, badge: 3 },
]

export default function MobileApp() {
  const { isAuthenticated, customerId } = useAuth()
  const { petEnabled, petType, petVariant } = usePet()
  const [screen, setScreen] = useState('inicio')
  const [prevScreen, setPrevScreen] = useState(null)

  const goTo = (s) => { setPrevScreen(screen); setScreen(s) }
  const goBack = () => { setScreen(prevScreen || 'inicio'); setPrevScreen(null) }

  // Visibility logic
  const isFullScreen  = FULL_SCREENS.includes(screen)   // no pet, no nav
  const isHomeScreen  = screen === 'inicio'
  const isFreeRoam    = !isFullScreen && !isHomeScreen   // pet roams freely
  const showBottomNav = isHomeScreen                     // nav only on home
  const showPet       = petEnabled && !isFullScreen
  const showHAVICorner = !petEnabled && !isFullScreen && !isHomeScreen
  const showBubble    = !isFullScreen && !isHomeScreen

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
          {screen === 'havi'       && <MobileHAVI customerId={customerId} onBack={goBack} />}
          {screen === 'ajustes'    && <MobileSettings onBack={goBack} onNavigate={goTo} />}
          {screen === 'salud'      && <MobileFinancialHealth onBack={goBack} onOpenHAVI={() => goTo('havi')} />}
          {screen === 'estado'     && <MobileStatement onBack={goBack} onOpenHAVI={() => goTo('havi')} />}
          {screen === 'mascota'    && <MobilePetCustomization onBack={goBack} />}
        </motion.div>
      </AnimatePresence>

      {/* HAVI suggestion bubble — above pet level when in free-roam sections */}
      {showBubble && (
        <HaviBubble
          screen={screen}
          onOpenHAVI={() => goTo('havi')}
          bottomOffset={isFreeRoam ? '24px' : '88px'}
        />
      )}

      {/* Pixel art pet */}
      {showPet && (
        <NavPet
          petType={petType}
          petVariant={petVariant}
          freeRoam={isFreeRoam}
          onPress={() => goTo('havi')}
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
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.5px' }}>HAVI</span>
        </motion.button>
      )}

      {/* Bottom nav — only on home screen */}
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
