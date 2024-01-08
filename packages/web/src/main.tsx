import { newEd25519 } from '@ldclabs/store'
import { createRoot } from 'react-dom/client'
import App from './App'

if ('serviceWorker' in navigator) {
  const scope = 'https://' + document.location.host
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(scope + '/sw.js', {
      scope,
    })
  })
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(<App />)
;(window as any)._nstop = { newEd25519 }
