// Capa de autenticación — Firebase Authentication (email/contraseña).
// Expone la misma interfaz que antes (registerUser, loginUser, logoutUser, getSession,
// onAuthChange, requestPasswordReset, markOnboarded, deleteAccount) para que el resto
// de la app no dependa del proveedor concreto.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
} from 'firebase/auth'
import { auth } from './firebase.js'

const ONBOARD_KEY = 'lifeos-onboarded-uids'

function readOnboardedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(ONBOARD_KEY)) || []) } catch { return new Set() }
}
function writeOnboardedSet(set) {
  localStorage.setItem(ONBOARD_KEY, JSON.stringify([...set]))
}

function toSession(user) {
  if (!user) return null
  return {
    id: user.uid,
    email: user.email,
    name: user.displayName || user.email.split('@')[0],
    onboarded: readOnboardedSet().has(user.uid),
    createdAt: user.metadata?.creationTime || null,
  }
}

let cachedSession = null
let ready = false
const listeners = new Set()

onAuthStateChanged(auth, user => {
  cachedSession = toSession(user)
  ready = true
  listeners.forEach(fn => fn(cachedSession))
})

export function getSession() {
  return cachedSession
}

export function isAuthReady() {
  return ready
}

// Registers fn for future changes; if the initial auth state has already
// resolved (Firebase resolves it asynchronously, possibly before a caller
// subscribes), fn is also invoked immediately with the current session so
// no state transition is missed.
export function onAuthChange(fn) {
  listeners.add(fn)
  if (ready) fn(cachedSession)
  return () => listeners.delete(fn)
}

function friendlyError(err) {
  const map = {
    'auth/email-already-in-use': 'Ya existe una cuenta con este correo. Inicia sesión en su lugar.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/weak-password': 'La contraseña es demasiado débil.',
    'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
    'auth/wrong-password': 'La contraseña no es correcta.',
    'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
    'auth/too-many-requests': 'Demasiados intentos. Prueba de nuevo en unos minutos.',
  }
  return new Error(map[err.code] || 'No se pudo completar la operación. Inténtalo de nuevo.')
}

export async function registerUser({ name, email, password }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    if (name) await updateProfile(cred.user, { displayName: name })
    cachedSession = toSession(cred.user)
    listeners.forEach(fn => fn(cachedSession))
    return cachedSession
  } catch (err) {
    throw friendlyError(err)
  }
}

export async function loginUser({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    cachedSession = toSession(cred.user)
    listeners.forEach(fn => fn(cachedSession))
    return cachedSession
  } catch (err) {
    throw friendlyError(err)
  }
}

export async function logoutUser() {
  await signOut(auth)
}

export function markOnboarded() {
  const user = auth.currentUser
  if (!user) return
  const set = readOnboardedSet()
  set.add(user.uid)
  writeOnboardedSet(set)
  cachedSession = toSession(user)
  listeners.forEach(fn => fn(cachedSession))
}

// No revela si el correo existe o no (evita enumeración de cuentas).
export async function requestPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase())
  } catch {
    // se ignora deliberadamente: el mensaje de éxito es el mismo exista o no la cuenta
  }
}

export async function deleteAccount() {
  const user = auth.currentUser
  if (!user) return
  await deleteUser(user)
}
