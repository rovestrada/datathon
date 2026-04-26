import { createContext, useContext, useState, useCallback } from 'react'

const PetContext = createContext(null)
const petKey = (userId) => `havi_pet_pref_${userId}`   // per-user localStorage key

// Default de mascota por arquetipo (asignado por el pipeline ML)
const ARCHETYPE_PET_MAP = {
  'Heavy User Crédito':    { petType: 'panda', petVariant: 'brown' },
  'Joven Digital':         { petType: 'fox',   petVariant: 'red'   },
  'Ahorrador Consolidado': { petType: 'dog',   petVariant: 'white' },
}
const DEFAULT_PET = { petType: 'fox', petVariant: 'red' }

export function PetProvider({ children }) {
  const [petEnabled, setPetEnabled] = useState(true)
  const [petType,    setPetType]    = useState(DEFAULT_PET.petType)
  const [petVariant, setPetVariant] = useState(DEFAULT_PET.petVariant)

  // Llamado al hacer login: aplica la preferencia guardada del usuario o
  // el default del arquetipo si nunca ha customizado su mascota
  const applyArchetypeDefault = useCallback((archetypeName, userId) => {
    const saved = (() => {
      try {
        const item = localStorage.getItem(petKey(userId))
        return item ? JSON.parse(item) : null
      } catch { return null }
    })()

    if (saved) {
      // Usuario ya eligió una mascota — restaurar su preferencia
      setPetType(saved.petType)
      setPetVariant(saved.petVariant)
    } else {
      // Sin preferencia guardada — usar el default del arquetipo
      const mapped = ARCHETYPE_PET_MAP[archetypeName] ?? DEFAULT_PET
      setPetType(mapped.petType)
      setPetVariant(mapped.petVariant)
    }
  }, [])

  // Llamado desde MobilePetCustomization — guarda la elección del usuario
  const setUserPet = useCallback((type, variant, userId) => {
    setPetType(type)
    setPetVariant(variant)
    if (userId) {
      localStorage.setItem(petKey(userId), JSON.stringify({ petType: type, petVariant: variant }))
    }
  }, [])

  return (
    <PetContext.Provider value={{
      petEnabled, setPetEnabled,
      petType, petVariant,
      setUserPet,            // ← usar en MobilePetCustomization
      applyArchetypeDefault, // ← llamar en MobileApp cuando llega el perfil
    }}>
      {children}
    </PetContext.Provider>
  )
}

export function usePet() {
  const ctx = useContext(PetContext)
  if (!ctx) throw new Error('usePet must be used inside PetProvider')
  return ctx
}
