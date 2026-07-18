// Capa de autenticación local — aislada del store de datos de la app (lifeos-v1).
//
// IMPORTANTE (producción): esto es persistencia local de demostración, NO un sistema de
// autenticación seguro. Las contraseñas se guardan hasheadas con SubtleCrypto (SHA-256 + sal),
// pero sin backend no hay verificación real de identidad, ni recuperación de contraseña real,
// ni protección contra manipulación del localStorage. Para producción, sustituir esta capa por
// un proveedor real (p. ej. Supabase Auth, Auth0, NextAuth) manteniendo la misma interfaz pública:
// registerUser, loginUser, logoutUser, getSession, requestPasswordReset, onAuthChange.

const USERS_KEY = 'lifeos-auth-users-v1'
const SESSION_KEY = 'lifeos-auth-session-v1'

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || [] } catch { return [] }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)) }

async function hash(pw, salt) {
  const enc = new TextEncoder().encode(salt + ':' + pw)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function randomSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
}

const listeners = new Set()
export function onAuthChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function emit() { const s = getSession(); listeners.forEach(fn => fn(s)) }

function setSession(user) {
  const session = { email: user.email, name: user.name, id: user.id, onboarded: !!user.onboarded, createdAt: user.createdAt }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  emit()
  return session
}

export async function registerUser({ name, email, password }) {
  email = email.trim().toLowerCase()
  const users = loadUsers()
  if (users.some(u => u.email === email)) {
    throw new Error('Ya existe una cuenta con este correo. Inicia sesión en su lugar.')
  }
  const salt = randomSalt()
  const passHash = await hash(password, salt)
  const user = { id: 'u_' + Date.now().toString(36), name, email, salt, passHash, onboarded: false, createdAt: new Date().toISOString() }
  users.push(user)
  saveUsers(users)
  return setSession(user)
}

export async function loginUser({ email, password }) {
  email = email.trim().toLowerCase()
  const users = loadUsers()
  const user = users.find(u => u.email === email)
  if (!user) throw new Error('No encontramos una cuenta con ese correo.')
  const check = await hash(password, user.salt)
  if (check !== user.passHash) throw new Error('La contraseña no es correcta.')
  return setSession(user)
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)
  emit()
}

export function markOnboarded() {
  const session = getSession()
  if (!session) return
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === session.id)
  if (idx >= 0) { users[idx].onboarded = true; saveUsers(users) }
  setSession(users[idx] || session)
}

// Simulado: sin backend de correo no se puede enviar un email real. No revela si el
// correo existe o no (evita enumeración de cuentas), y siempre resuelve tras una espera breve.
export function requestPasswordReset(email) {
  return new Promise(resolve => setTimeout(resolve, 900))
}

export function deleteAccount() {
  const session = getSession()
  if (!session) return
  const users = loadUsers().filter(u => u.id !== session.id)
  saveUsers(users)
  logoutUser()
}
