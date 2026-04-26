import { createContext, useContext, useState, useCallback } from 'react'
import { API_BASE } from '../utils/apiConfig'
import { useScreen } from './ScreenContext'

const AuthContext = createContext(null)
const LS_USER_KEY = 'havi_cached_user_id'   // localStorage — persiste
const SS_TOKEN_KEY = 'havi_token'            // sessionStorage — se limpia al cerrar

export function AuthProvider({ children }) {
  const { clearScreenCache } = useScreen()
  
  // user_id cacheado: solo para mostrar "Hola de nuevo" en el login
  const [cachedUserId]    = useState(() => localStorage.getItem(LS_USER_KEY))
  
  // user_id activo: se establece al hacer login exitoso
  const [customerId, setCustomerId] = useState(
    () => sessionStorage.getItem('havi_customer_id')
  )
  const [userName, setUserName] = useState(
    () => sessionStorage.getItem('havi_user_name')
  )
  const [token, setToken] = useState(
    () => sessionStorage.getItem(SS_TOKEN_KEY)
  )
  
  const [chatOpenData, setChatOpenData] = useState(null)
  const [loginError,   setLoginError]   = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const login = useCallback(async (userId, password) => {
    setLoginLoading(true)
    setLoginError(null)
    try {
      const authRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, password }),
      })
      if (!authRes.ok) {
        const err = await authRes.json()
        throw new Error(err.detail || 'Credenciales inválidas')
      }
      
      const { token: tok, user_id } = await authRes.json()

      // Cargar perfil completo para obtener el nombre
      let fullName = null
      try {
        const profileRes = await fetch(`${API_BASE}/user/profile/${user_id}`, {
          headers: { Authorization: `Bearer ${tok}` },
        })
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          fullName = profileData.full_name ?? null
        }
      } catch { /* nombre queda null, no bloquea el login */ }

      // Cachear datos
      localStorage.setItem(LS_USER_KEY, user_id)
      sessionStorage.setItem('havi_customer_id', user_id)
      if (fullName) sessionStorage.setItem('havi_user_name', fullName)
      sessionStorage.setItem(SS_TOKEN_KEY, tok)

      setCustomerId(user_id)
      setUserName(fullName)
      setToken(tok)

      // Cargar trigger activo (skin + mensaje de apertura)
      const openRes = await fetch(`${API_BASE}/chat/open?user_id=${user_id}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (openRes.ok) {
        const openData = await openRes.json()
        setChatOpenData(openData)
      }

    } catch (err) {
      setLoginError(err.message)
      throw err
    } finally {
      setLoginLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.clear()
    // NO limpiar localStorage — queremos recordar el user_id para la próxima vez
    setCustomerId(null)
    setUserName(null)
    setToken(null)
    setChatOpenData(null)
    clearScreenCache() // ← Limpiar datos de pantalla
  }, [clearScreenCache])

  return (
    <AuthContext.Provider value={{
      customerId, userName, token, chatOpenData, cachedUserId,
      loginError, loginLoading,
      isAuthenticated: Boolean(customerId && token),
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
