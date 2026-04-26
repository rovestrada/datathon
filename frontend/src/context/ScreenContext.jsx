import { createContext, useContext, useState, useCallback } from 'react'

const ScreenContext = createContext(null)

export function ScreenProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('inicio')
  // Cache de screen data: { [screenId]: data }
  const [screenCache, setScreenCache] = useState({})
  const [screenLoading, setScreenLoading] = useState(false)

  // Notificar el cambio de pantalla — llamar desde MobileApp.goTo()
  const navigateTo = useCallback((screen) => {
    setCurrentScreen(screen)
  }, [])

  // Guardar screen data en cache cuando llega de la API
  const cacheScreenData = useCallback((screenId, data) => {
    setScreenCache(prev => ({ ...prev, [screenId]: data }))
  }, [])

  return (
    <ScreenContext.Provider value={{
      currentScreen,
      screenCache,
      screenLoading,
      navigateTo,
      cacheScreenData,
      setScreenLoading,
    }}>
      {children}
    </ScreenContext.Provider>
  )
}

export function useScreen() {
  const ctx = useContext(ScreenContext)
  if (!ctx) throw new Error('useScreen must be used inside ScreenProvider')
  return ctx
}
