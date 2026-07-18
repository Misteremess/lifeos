import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider } from './store.jsx'
import App from './App.jsx'
import { getSession, onAuthChange } from './auth.js'
import './styles.css'

// key={uid} forces a full remount of StoreProvider (and its internal state) whenever the
// signed-in account changes, so switching accounts on the same device never mixes data.
function Root() {
  const [session, setSession] = useState(getSession())
  useEffect(() => onAuthChange(setSession), [])
  return (
    <StoreProvider key={session?.id || 'anon'} uid={session?.id || null}>
      <App />
    </StoreProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
