import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PetProvider } from './context/PetContext.jsx'
import { ScreenProvider } from './context/ScreenContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PetProvider>
        <ScreenProvider>
          <App />
        </ScreenProvider>
      </PetProvider>
    </AuthProvider>
  </StrictMode>,
)
