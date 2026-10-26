import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// After a redeploy, an open tab may request chunk hashes that no longer exist: reload once to pick up the new build.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'chunk-reload'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  event.preventDefault()
  window.location.reload()
})
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('chunk-reload'), 10_000))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
