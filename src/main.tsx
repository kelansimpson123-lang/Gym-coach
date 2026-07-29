import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initDatabase } from './database/db'
import { seedDatabaseIfNeeded } from './database/seed'

// Open (and, on first run, create) the local IndexedDB database before the
// app renders, then populate default reference data (movement categories,
// the starting split) if this is the very first launch.
initDatabase()
  .then(() => seedDatabaseIfNeeded())
  .catch((error) => {
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
