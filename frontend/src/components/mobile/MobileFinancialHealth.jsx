import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, TrendingUp, TrendingDown, Minus, ShieldCheck } from 'lucide-react'
import { useScreen } from '../../context/ScreenContext'

// Gauge arc helpers
function ScoreGauge({ score, label }) {
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
        {label || (score >= 70 ? 'Buena' : score >= 40 ? 'Regular' : 'Baja')}
      </text>
    </svg>
  )
}

export default function MobileFinancialHealth({ onBack, onOpenHAVI }) {
  const [tab, setTab] = useState('resumen')
  const { screenCache } = useScreen()

  // Extraer datos dinámicos del JSON de pantalla 'health'
  const healthData = screenCache.health?.data || {}
  const score = healthData.score_financiero ?? 0
  const scoreLabel = healthData.score_label ?? 'Consultando...'
  const balance = healthData.saldo_disponible ?? 0
  const saving = healthData.ahorro_total ?? 0
  const expenses = healthData.ahorro_potencial_mensual ?? 0 // Usado como proxy de ahorro posible
  const categories = healthData.distribucion_gastos || []

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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>Tu score financiero</p>
              <ScoreGauge score={score} label={scoreLabel} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Saldo disponible', value: `$${balance.toLocaleString()}`, color: '#4db6e8' },
                { label: 'Ahorro total', value: `$${saving.toLocaleString()}`, color: '#22d3ee' },
                { label: 'Ahorro potencial', value: `$${expenses.toLocaleString()}`, color: '#4ade80' },
                { label: 'Gasto analizado', value: 'Completo', color: '#f59e0b' },
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
            {categories.length > 0 ? categories.map((cat, i) => {
              const pct = (cat.pct * 100).toFixed(0)
              return (
                <motion.div
                  key={cat.categoria}
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
                      <TrendingDown size={15} color="#a78bfa" />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>{cat.categoria}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 600 }}>
                      ${cat.monto.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#2a2a3a', borderRadius: '3px' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.08 }}
                      style={{ height: '100%', background: '#a78bfa', borderRadius: '3px' }}
                    />
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#555' }}>
                    Representa el {pct}% de tus gastos analizados
                  </p>
                </motion.div>
              )
            }) : (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>Cargando análisis de gastos...</p>
            )}
          </motion.div>
        )}

        {tab === 'consejos' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>Consejos de HAVI basados en tu perfil</p>
            {(healthData.consejos || ["Analizando tus movimientos para darte mejores consejos..."]).map((text, i) => (
              <motion.div
                key={i}
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
                <span style={{ fontSize: '22px' }}>💡</span>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '14px', color: 'white', lineHeight: 1.5 }}>{text}</p>
                  <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 600 }}>Hablar con HAVI →</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
