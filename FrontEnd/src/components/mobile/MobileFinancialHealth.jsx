import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, TrendingUp, TrendingDown, Minus, ShieldCheck } from 'lucide-react'

const SCORE = 72

// Gauge arc helpers
function ScoreGauge({ score }) {
  const r = 80
  const cx = 110
  const cy = 110
  const arcLen = Math.PI * r
  const filled = (score / 100) * arcLen
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const color = score >= 70 ? '#22d3ee' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <svg width="220" height="116" viewBox="0 0 220 116">
      <path d={d} fill="none" stroke="#1a1a2a" strokeWidth="18" strokeLinecap="round" />
      <motion.path
        d={d} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${arcLen}` }}
        animate={{ strokeDasharray: `${filled} ${arcLen}` }}
        transition={{ duration: 1.3, ease: 'easeOut', delay: 0.3 }}
      />
      <text x="110" y="100" textAnchor="middle" fill="white" fontSize="32" fontWeight="800">{score}</text>
      <text x="110" y="116" textAnchor="middle" fill={color} fontSize="12" fontWeight="600">
        {score >= 70 ? 'Buena' : score >= 40 ? 'Regular' : 'Baja'}
      </text>
    </svg>
  )
}

const CATEGORIES = [
  { label: 'Ahorro', value: 24.10, target: 100, color: '#22d3ee', icon: TrendingUp, trend: 'up' },
  { label: 'Gastos fijos', value: 0, target: 500, color: '#a78bfa', icon: Minus, trend: 'flat' },
  { label: 'Gastos variables', value: 0, target: 300, color: '#f59e0b', icon: TrendingDown, trend: 'flat' },
  { label: 'Rendimientos', value: 0.08, target: 10, color: '#4ade80', icon: TrendingUp, trend: 'up' },
]

const TIPS = [
  { id: 1, icon: '💡', text: 'Activa el redondeo automático para aumentar tu ahorro sin esfuerzo.' },
  { id: 2, icon: '📊', text: 'Establece un presupuesto mensual de gastos para mejorar tu score.' },
  { id: 3, icon: '🏆', text: 'Con $75 MXN más en ahorro, llegas al 25% de tu meta mensual.' },
]

export default function MobileFinancialHealth({ onBack, onOpenHAVI }) {
  const [tab, setTab] = useState('resumen')

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: '#0a0a12', overflowY: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#0d1022', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid #1a1a2a', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '22px', padding: '4px' }}>‹</button>
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'white', flex: 1 }}>Salud Financiera</h1>
        <ShieldCheck size={20} color="#a78bfa" />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: '#0d1022', padding: '0 20px', borderBottom: '1px solid #1a1a2a' }}>
        {['resumen', 'categorías', 'consejos'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? '#a78bfa' : '#6b7280',
            fontSize: '13px', fontWeight: tab === t ? 700 : 400,
            borderBottom: tab === t ? '2px solid #a78bfa' : '2px solid transparent',
            textTransform: 'capitalize',
          }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        {tab === 'resumen' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Score gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>Tu score financiero</p>
              <ScoreGauge score={SCORE} />
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Saldo disponible', value: '$96.84', color: '#4db6e8' },
                { label: 'Ahorro total', value: '$24.10', color: '#22d3ee' },
                { label: 'Rendimiento', value: '$0.08', color: '#4ade80' },
                { label: 'Gastos del mes', value: '$0.00', color: '#f59e0b' },
              ].map(card => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#1a1a2a', borderRadius: '12px', padding: '14px 16px',
                    border: '1px solid #2a2a3a',
                  }}
                >
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#6b7280' }}>{card.label}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: card.color }}>{card.value}</p>
                </motion.div>
              ))}
            </div>


          </motion.div>
        )}

        {tab === 'categorías' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon
              const pct = Math.min((cat.value / cat.target) * 100, 100)
              return (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    background: '#1a1a2a', borderRadius: '12px', padding: '16px',
                    marginBottom: '12px', border: '1px solid #2a2a3a',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={15} color={cat.color} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{cat.label}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: cat.color, fontWeight: 600 }}>
                      ${cat.value.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#2a2a3a', borderRadius: '3px' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.08 }}
                      style={{ height: '100%', background: cat.color, borderRadius: '3px' }}
                    />
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#555' }}>
                    Meta: ${cat.target.toFixed(2)} MXN
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {tab === 'consejos' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>Consejos personalizados de HAVI para ti</p>
            {TIPS.map((tip, i) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={onOpenHAVI}
                style={{
                  background: '#1a1a2a', borderRadius: '14px', padding: '16px',
                  marginBottom: '12px', border: '1px solid #2a2a3a',
                  display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '22px' }}>{tip.icon}</span>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '14px', color: 'white', lineHeight: 1.5 }}>{tip.text}</p>
                  <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 600 }}>Preguntarle a HAVI →</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
