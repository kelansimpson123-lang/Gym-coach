import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initDatabase } from './database/db'

// Open (and, on first run, create) the local IndexedDB database before the
// app renders. This is the "foundation" piece for Phase 1 — Phase 2 adds
// the actual read/write service functions on top of this connection.
initDatabase().catch((error) => {
  // The app must never hard-crash because storage failed to open — later
  // phases will surface this via the UI's error-handling requirements.
  console.error('Failed to initialise the local database:', error)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
