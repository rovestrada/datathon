// GIF-based pet sprite configuration for vscode-pets assets
// Assets live under public/pets/{folder}/{variant}_{anim}.gif

export const PET_TYPES = {
  panda: {
    label: 'Panda',
    emoji: '🐼',
    folder: 'panda',
    defaultVariant: 'black',
    variants: [
      { id: 'black', label: 'Negro',  color: '#1a1a1a' },
      { id: 'brown', label: 'Café',   color: '#8B5E3C' },
    ],
  },
  dog: {
    label: 'Perro',
    emoji: '🐶',
    folder: 'dog',
    defaultVariant: 'brown',
    variants: [
      { id: 'brown', label: 'Café',   color: '#8B5E3C' },
      { id: 'red',   label: 'Rojo',   color: '#c0582a' },
      { id: 'white', label: 'Blanco', color: '#f0f0ee' },
      { id: 'black', label: 'Negro',  color: '#2a2a2a' },
    ],
  },
  fox: {
    label: 'Zorro',
    emoji: '🦊',
    folder: 'fox',
    defaultVariant: 'red',
    variants: [
      { id: 'red',   label: 'Rojo',   color: '#c0582a' },
      { id: 'white', label: 'Blanco', color: '#f0f0ee' },
    ],
  },
}

export function getGifUrl(petType, variant, anim) {
  const folder = PET_TYPES[petType]?.folder ?? 'panda'
  return `/pets/${folder}/${variant}_${anim}.gif`
}

export function getIconUrl(petType) {
  const folder = PET_TYPES[petType]?.folder ?? 'panda'
  return `/pets/${folder}/icon.png`
}
