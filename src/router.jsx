import React, { createContext, useContext, useSyncExternalStore } from 'react'

const listeners = new Set()
let currentPath = window.location.pathname

function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function getSnapshot() { return currentPath }

export function navigate(path) {
  if (path !== currentPath) {
    window.history.pushState({}, '', path)
    currentPath = path
    listeners.forEach(fn => fn())
  }
}

window.addEventListener('popstate', () => {
  currentPath = window.location.pathname
  listeners.forEach(fn => fn())
})

const RouterCtx = createContext(null)

export function RouterProvider({ children }) {
  const path = useSyncExternalStore(subscribe, getSnapshot)
  return <RouterCtx.Provider value={{ path }}>{children}</RouterCtx.Provider>
}

export function useRoute() {
  return useContext(RouterCtx).path
}

export function Link({ to, className, children, ...rest }) {
  return (
    <a href={to} className={className} onClick={e => { e.preventDefault(); navigate(to) }} {...rest}>
      {children}
    </a>
  )
}
