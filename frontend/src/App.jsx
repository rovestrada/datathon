import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import FloatingPet from './components/FloatingPet'
import ChatbotHAVI, { ChatToggleButton } from './components/ChatbotHAVI'
import MobileApp from './components/mobile/MobileApp'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function AppContent() {
  const { isAuthenticated, customerId, token, chatOpenData } = useAuth()
  const [chatOpen, setChatOpen] = useState(false)
  const isMobile = useIsMobile()

  const openChat = useCallback(() => setChatOpen(true), [])
  const toggleChat = useCallback(() => setChatOpen(o => !o), [])

  // Mobile: always use MobileApp (it handles its own auth gate)
  if (isMobile) {
    return <MobileApp />
  }

  return (
    <AnimatePresence mode="wait">
      {isAuthenticated ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ minHeight: '100vh', width: '100%', display: 'block', position: 'relative' }}
        >
          <Dashboard />
          <FloatingPet onOpenChat={openChat} />
          <ChatbotHAVI 
            isOpen={chatOpen} 
            onClose={() => setChatOpen(false)} 
            customerId={customerId} 
            token={token}
            chatOpenData={chatOpenData}
          />
          <ChatToggleButton isOpen={chatOpen} onClick={toggleChat} unread={1} />
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Login />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return <AppContent />
}
