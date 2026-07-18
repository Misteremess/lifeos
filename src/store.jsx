import React, { createContext, useContext, useEffect, useReducer, useState } from 'react'
import { generateEmptyData, todayKey, levelFromXp } from './data.js'

const KEY = 'lifeos-v1'
const Ctx = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return generateEmptyData()
}

function ensureToday(state) {
  const k = todayKey()
  if (!state.days[k]) {
    state = { ...state, days: { ...state.days, [k]: { habits: {}, sleepH: 0, sleepQuality: 0, energy: 0, stress: 0, mood: 0, moodTags: [], steps: 0, water: 0, focusSessions: [], expenses: [], frictions: [], closed: false, note: '' } } }
  }
  return state
}

function reducer(state, action) {
  const k = todayKey()
  const patchDay = (key, patch) => ({ ...state, days: { ...state.days, [key]: { ...state.days[key], ...patch } } })
  switch (action.type) {
    case 'set': return { ...state, ...action.patch }
    case 'day': return patchDay(action.key || k, action.patch)
    case 'toggleHabit': {
      const day = state.days[action.key || k]
      const cur = day.habits?.[action.id]
      const done = !cur?.done
      const habit = state.habits.find(h => h.id === action.id)
      const next = patchDay(action.key || k, { habits: { ...day.habits, [action.id]: { done, value: done ? action.value ?? habit.target : 0 } } })
      return { ...next, xp: state.xp + (done ? habit.xp : -habit.xp), coins: state.coins + (done ? Math.ceil(habit.xp / 5) : -Math.ceil(habit.xp / 5)), areaXp: { ...state.areaXp, [habit.area]: (state.areaXp[habit.area] || 0) + (done ? habit.xp : -habit.xp) } }
    }
    case 'addXp': return { ...state, xp: state.xp + action.xp, coins: state.coins + Math.ceil(action.xp / 5) }
    case 'addHabit': return { ...state, habits: [...state.habits, action.habit] }
    case 'addGoal': return { ...state, goals: [...state.goals, action.goal] }
    case 'updateGoal': return { ...state, goals: state.goals.map(g => g.id === action.id ? { ...g, ...action.patch } : g) }
    case 'addJournal': return { ...state, journal: [{ id: Date.now(), ...action.entry }, ...state.journal] }
    case 'journalFav': return { ...state, journal: state.journal.map(j => j.id === action.id ? { ...j, fav: !j.fav } : j) }
    case 'addExpense': {
      const day = state.days[k]
      return patchDay(k, { expenses: [...day.expenses, action.expense] })
    }
    case 'addFocusSession': {
      const day = state.days[k]
      return { ...patchDay(k, { focusSessions: [...day.focusSessions, action.session] }), xp: state.xp + action.session.xp, coins: state.coins + 5 }
    }
    case 'completeMission': return {
      ...state,
      missions: state.missions.map(m => m.id === action.id ? { ...m, done: true, progress: m.target } : m),
      xp: state.xp + (state.missions.find(m => m.id === action.id)?.xp || 0),
      coins: state.coins + 10,
    }
    case 'unlockAch': return state.unlockedAchievements.includes(action.id) ? state : { ...state, unlockedAchievements: [...state.unlockedAchievements, action.id], xp: state.xp + 50, coins: state.coins + 20 }
    case 'redeem': return { ...state, coins: state.coins - action.cost }
    case 'friction': {
      const day = state.days[k]
      return patchDay(k, { frictions: [...day.frictions, action.f] })
    }
    case 'reset': { localStorage.removeItem(KEY); return ensureToday(generateEmptyData()) }
    default: return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => ensureToday(load()))
  const [toasts, setToasts] = useState([])
  const [levelUp, setLevelUp] = useState(null)

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)) }, [state])
  useEffect(() => { document.documentElement.dataset.theme = state.theme }, [state.theme])

  const toast = (msg, xp) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, xp }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }

  // level-up detection
  const prevLvl = React.useRef(levelFromXp(state.xp).lvl)
  useEffect(() => {
    const lvl = levelFromXp(state.xp).lvl
    if (lvl > prevLvl.current) { setLevelUp(lvl); setTimeout(() => setLevelUp(null), 3500) }
    prevLvl.current = lvl
  }, [state.xp])

  return <Ctx.Provider value={{ state, dispatch, toast, toasts, levelUp }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
