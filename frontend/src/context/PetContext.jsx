import { createContext, useContext, useState, useCallback } from 'react'

const PetContext = createContext(null)
const LS_PET_KEY = 'havi_pet_preference'   // localStorage: la elección del usuario

// Default de mascota por arquetipo (asignado por el pipeline ML)
const ARCHETYPE_PET_MAP = {
  'Joven Profesional Urbano': { petType: 'fox',   petVariant: 'red'   },
  'Estudiante Digital':       { petType: 'panda', petVariant: 'black' },
  'Ahorrador Precavido':      { petType: 'dog',   petVariant: 'white' },
  'Emprendedor Digital':      { petType: 'panda', petVariant: 'brown' },
  'Usuario Inactivo':         { petType: 'dog',   petVariant: 'brown' },
}
const DEFAULT_PET = { petType: 'fox', petVariant: 'red' }

export function PetProvider({ children }) {
  const [petEnabled, setPetEnabled] = useState(true)

  // Leer preferencia guardada del usuario, si existe
  const savedPref = (() => {
    try { 
      const item = localStorage.getItem(LS_PET_KEY)
      return item ? JSON.parse(item) : null 
    } catch { 
      return null 
    }
  })()

  const [petType,    setPetType]    = useState(savedPref?.petType    ?? DEFAULT_PET.petType)
  const [petVariant, setPetVariant] = useState(savedPref?.petVariant ?? DEFAULT_PET.petVariant)

  // Llamado al hacer login: aplica el default del arquetipo SI el usuario
  // nunca ha customizado su mascota
  const applyArchetypeDefault = useCallback((archetypeName) => {
    if (localStorage.getItem(LS_PET_KEY)) return  // usuario ya eligió — respetar
    const mapped = ARCHETYPE_PET_MAP[archetypeName] ?? DEFAULT_PET
    setPetType(mapped.petType)
    setPetVariant(mapped.petVariant)
  }, [])

  // Llamado desde MobilePetCustomization — guarda la elección del usuario
  const setUserPet = useCallback((type, variant) => {
    setPetType(type)
    setPetVariant(variant)
    localStorage.setItem(LS_PET_KEY, JSON.stringify({ petType: type, petVariant: variant }))
  }, [])

  return (
    <PetContext.Provider value={{
      petEnabled, setPetEnabled,
      petType, petVariant,
      setUserPet,           // ← usar en MobilePetCustomization
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
