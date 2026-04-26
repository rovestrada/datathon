import { createContext, useContext, useState, useEffect } from 'react'

const PetContext = createContext()

const STORAGE_KEY = 'havi_pet_settings'
const DEFAULTS = {
  petEnabled:  true,
  petType:     'panda',
  petVariant:  'black',
  cardSkin:    true,
}

export function PetProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
    } catch {
      return DEFAULTS
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const update = (patch) => setSettings(prev => ({ ...prev, ...patch }))

  return (
    <PetContext.Provider value={{ ...settings, update }}>
      {children}
    </PetContext.Provider>
  )
}

export function usePet() {
  return useContext(PetContext)
}
