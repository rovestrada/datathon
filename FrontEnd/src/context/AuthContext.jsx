import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'havi_customer_id'

export function AuthProvider({ children }) {
  const [customerId, setCustomerId] = useState(() => localStorage.getItem(SESSION_KEY))

  const login = useCallback((id) => {
    localStorage.setItem(SESSION_KEY, id)
    setCustomerId(id)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setCustomerId(null)
  }, [])

  const isAuthenticated = Boolean(customerId)

  return (
    <AuthContext.Provider value={{ customerId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
