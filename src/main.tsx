import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registro do Service Worker (PWA) via vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão disponível. Deseja atualizar agora?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('[PWA] O aplicativo está pronto para uso offline.')
  },
})
