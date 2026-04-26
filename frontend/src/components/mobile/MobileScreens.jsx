import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'

function SimpleMobileScreen({ title, onBack, children }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: '#0a0a12',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: '#0d1022', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid #1a1a2a',
      }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '22px', padding: '4px' }}>‹</button>
        )}
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'white', flex: 1, textAlign: onBack ? 'left' : 'center' }}>
          {title}
        </h1>
      </div>
      <div style={{ flex: 1, padding: '24px 20px', color: '#9ca3af' }}>
        {children}
      </div>
    </div>
  )
}

export function MobilePagos({ onBack }) {
  return (
    <SimpleMobileScreen title="Pagos" onBack={onBack}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <p style={{ fontSize: '15px', color: 'white', marginBottom: '16px' }}>Tus pagos programados</p>
        <div style={{
          background: '#1a1a2a', borderRadius: '12px', padding: '20px',
          textAlign: 'center', color: '#555',
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>No tienes pagos programados aún.</p>
        </div>
      </motion.div>
    </SimpleMobileScreen>
  )
}

export function MobileTransferir({ customerId, onBack }) {
  return (
    <SimpleMobileScreen title="Transferir" onBack={onBack}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <p style={{ fontSize: '15px', color: 'white', marginBottom: '16px' }}>
          Hola, Usuario #{customerId}. ¿A dónde vas a transferir?
        </p>
        <div style={{
          background: '#1a1a2a', borderRadius: '12px', padding: '20px',
          textAlign: 'center', color: '#555',
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>Ingresa CLABE o número de tarjeta.</p>
        </div>
      </motion.div>
    </SimpleMobileScreen>
  )
}

export function MobileBuzon({ onBack }) {
  const items = [
    { id: 1, text: 'Tu ahorro inmediato generó $0.08 MXN de rendimiento.', time: 'hace 2h' },
    { id: 2, text: 'Recuerda activar Súper Cashback para tu próxima compra.', time: 'hace 5h' },
    { id: 3, text: 'Bienvenido a hey, banco. Explora tus productos disponibles.', time: 'ayer' },
  ]
  return (
    <SimpleMobileScreen title="Buzón" onBack={onBack}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            style={{
              background: '#1a1a2a', borderRadius: '12px', padding: '14px 16px',
              marginBottom: '10px',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'white' }}>{item.text}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>{item.time}</p>
          </motion.div>
        ))}
      </motion.div>
    </SimpleMobileScreen>
  )
}
