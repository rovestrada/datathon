import { useState } from 'react'
import { ChevronLeft, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { PET_TYPES, getGifUrl, getIconUrl } from './petSprites'
import { usePet } from '../../context/PetContext'

export default function MobilePetCustomization({ onBack }) {
  const { petEnabled, petType, petVariant, update } = usePet()

  const typeMeta     = PET_TYPES[petType] || PET_TYPES.panda
  const defaultVar   = typeMeta.defaultVariant

  const [draftEnabled, setDraftEnabled] = useState(petEnabled)
  const [draftType,    setDraftType]    = useState(petType || 'panda')
  const [draftVariant, setDraftVariant] = useState(petVariant || defaultVar)

  // When changing animal type reset variant to its default
  function selectType(t) {
    setDraftType(t)
    setDraftVariant(PET_TYPES[t].defaultVariant)
  }

  function save() {
    update({ petEnabled: draftEnabled, petType: draftType, petVariant: draftVariant })
    onBack()
  }

  const draftMeta    = PET_TYPES[draftType] || PET_TYPES.panda
  const previewSrc   = getGifUrl(draftType, draftVariant, 'idle')

  return (
    <div className="flex flex-col h-full bg-[#0a0a1a] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10 active:bg-white/20">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Personalizar mascota</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">

        {/* Enable toggle */}
        <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">Mascota activa</p>
            <p className="text-sm text-white/50">Muestra tu compañero virtual</p>
          </div>
          <button
            onClick={() => setDraftEnabled(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${draftEnabled ? 'bg-purple-500' : 'bg-white/20'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${draftEnabled ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {draftEnabled && (
          <>
            {/* Live preview */}
            <div className="flex flex-col items-center gap-2 bg-white/5 rounded-2xl p-4">
              <p className="text-sm text-white/60 mb-1">Vista previa</p>
              <img
                src={previewSrc}
                alt={draftMeta.label}
                width={96}
                height={96}
                style={{ imageRendering: 'pixelated' }}
              />
              <p className="text-sm font-medium">{draftMeta.label} · {draftMeta.variants.find(v => v.id === draftVariant)?.label}</p>
            </div>

            {/* Animal selector */}
            <div>
              <p className="text-sm text-white/60 mb-2 px-1">Animal</p>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(PET_TYPES).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => selectType(key)}
                    className={`flex flex-col items-center gap-2 py-3 rounded-2xl border-2 transition-all ${
                      draftType === key
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 active:bg-white/10'
                    }`}
                  >
                    <img
                      src={getIconUrl(key)}
                      alt={meta.label}
                      width={40}
                      height={40}
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="text-xs font-medium">{meta.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Variant (color) selector */}
            <div>
              <p className="text-sm text-white/60 mb-2 px-1">Color</p>
              <div className="grid grid-cols-4 gap-3">
                {draftMeta.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setDraftVariant(v.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                      draftVariant === v.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 active:bg-white/10'
                    }`}
                  >
                    <img
                      src={getGifUrl(draftType, v.id, 'idle')}
                      alt={v.label}
                      width={48}
                      height={48}
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="text-[11px] font-medium">{v.label}</span>
                    {draftVariant === v.id && <Check size={12} className="text-purple-400" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save button */}
      <div className="px-4 pb-8 pt-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={save}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white"
        >
          Guardar cambios
        </motion.button>
      </div>
    </div>
  )
}
