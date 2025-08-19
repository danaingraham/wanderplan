import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './utils/productionCleanup' // Production cleanup utility

// Initialize Google Places service early for global availability
if (import.meta.env.DEV) {
  console.log('🚀 Initializing application...')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
