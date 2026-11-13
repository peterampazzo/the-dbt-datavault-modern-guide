import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { redirectLegacyHash } from './lib/books'

// After a redeploy, an open tab may request chunk hashes that no longer exist: reload once to pick up the new build.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'chunk-reload'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  event.preventDefault()
  window.location.reload()
})
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('chunk-reload'), 10_000))

// Registered before the router so old links are rewritten before it reads the URL.
redirectLegacyHash()
window.addEventListener('popstate', redirectLegacyHash)
window.addEventListener('hashchange', redirectLegacyHash)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
