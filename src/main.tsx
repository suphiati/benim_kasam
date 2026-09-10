import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// iOS CI duman testi: yalnızca VITE_SMOKE_TEST=1 derlemesinde (bkz. src/smokeTest.ts).
// Normal derlemede koşul sabit false olur ve dinamik import paketten tamamen elenir.
if (import.meta.env.VITE_SMOKE_TEST === '1') {
  void import('./smokeTest').then((m) => m.runSmokeTest())
}
