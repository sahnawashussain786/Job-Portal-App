import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider must wrap the router so every route can read the session. */}
    <AuthProvider>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          className: 'text-sm',
          style: { borderRadius: '10px' },
        }}
      />
    </AuthProvider>
  </StrictMode>,
)
