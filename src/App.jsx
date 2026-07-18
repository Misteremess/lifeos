import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from './store.jsx'
import { Icons, Modal, Ring, Num } from './components.jsx'
import { Logo } from './Logo.jsx'
import { THEMES, AREAS, dayKey, todayKey, levelFromXp, dayCompletion, globalStreak, momentum, dayArchetype } from './data.js'
import { Home, MyDay, Habits, HabitDetail, NewHabitModal } from './screens1.jsx'
import { TimeScreen, FocusMode, Goals, GoalDetail, Areas } from './screens2.jsx'
import { Health, Mood, Finance, Journal } from './screens3.jsx'
import { Stats, Insights, WeeklyReview, Missions, Achievements, Profile, Settings } from './screens4.jsx'
import { RouterProvider, useRoute, navigate } from './router.jsx'
import { getSession, onAuthChange, logoutUser, markOnboarded } from './auth.js'
import { Landing, LoginPage, RegisterPage, ForgotPasswordPage, LegalPage, NotFoundPage } from './publicPages.jsx'

const NAV = [
  ['inicio', 'Inicio', 'home'], ['midia', 'Mi día', 'day'], ['habitos', 'Hábitos', 'habits'],
  ['tiempo', 'Tiempo', 'time'], ['objetivos', 'Objetivos', 'goals'], ['areas', 'Áreas de vida', 'areas'],
  ['salud', 'Salud y energía', 'health'], ['animo', 'Estado de ánimo', 'mood'], ['finanzas', 'Finanzas', 'finance'],
  ['diario', 'Diario', 'journal'], ['stats', 'Estadísticas', 'stats'], ['insights', 'Insights', 'spark'],
  ['misiones', 'Misiones', 'missions'], ['logros', 'Logros', 'trophy'], ['perfil', 'Perfil', 'user'], ['ajustes', 'Ajustes', 'settings'],
]

export default function App() {
  const [session, setSession] = useState(getSession())
  const [authReady, setAuthReady] = useState(false)
  useEffect(() => onAuthChange(s => { setSession(s); setAuthReady(true) }), [])

  if (!authReady) return <div className="pub" style={{ minHeight: '100vh' }} />

  return (
    <RouterProvider>
      <RouteSwitch session={session} />
    </RouterProvider>
  )
}

function RouteSwitch({ session }) {
  const path = useRoute()
  const { dispatch, state } = useStore()

  useEffect(() => { window.scrollTo(0, 0) }, [path])

  // Redirects are side effects, not render output — doing them inline during
  // render trips React's "setState while rendering another component" guard
  // and can silently drop the navigation. Compute the target, then effect it.
  // Every hook below must run on every path — including '/' — so the early
  // returns for actual screens stay after all hook calls (Rules of Hooks).
  const redirectTo =
    (path === '/login' && session) ? '/app/inicio' :
    (path === '/register' && session) ? '/app/inicio' :
    (path === '/onboarding' && !session) ? '/login' :
    (path.startsWith('/app') && !session) ? '/login' :
    (path.startsWith('/app') && session && !session.onboarded) ? '/onboarding' :
    null

  useEffect(() => { if (redirectTo) navigate(redirectTo) }, [redirectTo])

  if (path === '/') return <Landing />
  if (redirectTo) return null
  if (path === '/login') return <LoginPage />
  if (path === '/register') return <RegisterPage />
  if (path === '/forgot-password') return <ForgotPasswordPage />
  if (path === '/privacy') return <LegalPage kind="privacy" />
  if (path === '/terms') return <LegalPage kind="terms" />

  if (path === '/onboarding') {
    return <Onboarding onDone={() => {
      dispatch({ type: 'set', patch: { onboarded: true } })
      markOnboarded()
      navigate('/app/inicio')
    }} />
  }

  if (path.startsWith('/app')) {
    const initial = path.replace(/^\/app\/?/, '') || 'inicio'
    return <AppShell initialView={initial} onLogout={() => { logoutUser(); navigate('/') }} />
  }

  return <NotFoundPage />
}

function AppShell({ initialView, onLogout }) {
  const { state, dispatch, toast, toasts, levelUp } = useStore()
  const [view, setView] = useState(initialView && initialView !== 'onboarding' ? initialView : 'inicio')
  const [habitId, setHabitId] = useState(null)
  const [goalId, setGoalId] = useState(null)
  const [palette, setPalette] = useState(false)
  const [focusCfg, setFocusCfg] = useState(null)
  const [closeDay, setCloseDay] = useState(false)
  const [review, setReview] = useState(false)
  const [newHabit, setNewHabit] = useState(false)

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPalette(p => !p) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const go = (v) => {
    setView(v); setHabitId(null); setGoalId(null); window.scrollTo(0, 0)
    window.history.pushState({}, '', `/app/${v}`)
  }

  // Recovery mode detection
  const recovery = useMemo(() => {
    const last3 = [1, 2, 3].map(i => state.days[dayKey(-i)]).filter(Boolean)
    return last3.length === 3 && last3.every(d => dayCompletion(d, state.habits) < 25)
  }, [state.days])

  const screens = {
    inicio: <Home go={go} />,
    midia: <MyDay go={go} openCloseDay={() => setCloseDay(true)} />,
    habitos: habitId ? <HabitDetail id={habitId} back={() => setHabitId(null)} /> : <Habits go={go} openHabit={setHabitId} />,
    tiempo: <TimeScreen onFocus={setFocusCfg} />,
    objetivos: goalId ? <GoalDetail id={goalId} back={() => setGoalId(null)} /> : <Goals openGoal={setGoalId} />,
    areas: <Areas />,
    salud: <Health />, animo: <Mood />, finanzas: <Finance />, diario: <Journal />,
    stats: <Stats />, insights: <Insights />, misiones: <Missions openReview={() => setReview(true)} />,
    logros: <Achievements />, perfil: <Profile />, ajustes: <Settings />,
  }
  const lvl = levelFromXp(state.xp)

  return (
    <div className="shell">
      <nav className="sidenav" aria-label="Navegación principal">
        <div className="brand"><Logo size={26} sub="sistema personal" /></div>
        <button className="navitem" onClick={() => setPalette(true)} style={{ border: '1px solid var(--border)', marginBottom: 8 }}>
          <span style={{ flex: 1 }}>Buscar o actuar…</span><span className="kbd">⌘K</span>
        </button>
        {NAV.slice(0, 5).map(([id, label, ic]) => (
          <button key={id} className={`navitem ${view === id ? 'active' : ''}`} onClick={() => go(id)} aria-current={view === id}>{Icons[ic]} {label}</button>
        ))}
        <div className="nav-sep">Registro</div>
        {NAV.slice(5, 10).map(([id, label, ic]) => (
          <button key={id} className={`navitem ${view === id ? 'active' : ''}`} onClick={() => go(id)}>{Icons[ic]} {label}</button>
        ))}
        <div className="nav-sep">Progreso</div>
        {NAV.slice(10).map(([id, label, ic]) => (
          <button key={id} className={`navitem ${view === id ? 'active' : ''}`} onClick={() => go(id)}>{Icons[ic]} {label}</button>
        ))}
        <div className="nav-level">
          <div className="row between xs"><b>Nivel {lvl.lvl}</b><span className="faint mono">{state.coins} ⬡</span></div>
          <div className="pbar thin" style={{ margin: '6px 0 4px' }}><div style={{ width: `${lvl.pct}%` }} /></div>
          <div className="xs faint">{lvl.need - lvl.into} XP para nivel {lvl.lvl + 1}</div>
        </div>
        <button className="navitem" style={{ marginTop: 4, color: 'var(--text3)' }} onClick={onLogout}>{Icons.settings} Cerrar sesión</button>
      </nav>

      <main className="main">
        {recovery && (
          <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--warn)' }}>
            <b className="small">Parece que necesitas un día más ligero.</b>
            <p className="xs muted" style={{ marginTop: 4 }}>Modo recuperación disponible: hoy basta con tu Minimum Viable Day ({state.mvd.length} acciones pequeñas). La constancia se reconstruye, no se fuerza.</p>
          </div>
        )}
        {screens[view]}
      </main>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {[['inicio', 'Inicio', 'home'], ['midia', 'Mi día', 'day'], ['habitos', 'Hábitos', 'habits'], ['stats', 'Stats', 'stats'], ['perfil', 'Perfil', 'user']].map(([id, label, ic]) => (
          <button key={id} className={view === id ? 'active' : ''} onClick={() => go(id)}>{Icons[ic]}<span>{label}</span></button>
        ))}
      </nav>
      <button className="fab" aria-label="Abrir acciones rápidas" onClick={() => setPalette(true)}>{Icons.plus}</button>

      {palette && <Palette close={() => setPalette(false)} go={go} actions={{
        focus: () => setFocusCfg({ mins: 25, project: 'Sesión rápida', mode: 'Pomodoro' }),
        newHabit: () => setNewHabit(true), closeDay: () => setCloseDay(true), review: () => setReview(true),
      }} />}
      {focusCfg && <FocusMode config={focusCfg} onExit={() => setFocusCfg(null)} />}
      {closeDay && <CloseDayModal onClose={() => setCloseDay(false)} />}
      {review && <WeeklyReview onDone={() => setReview(false)} />}
      {newHabit && <NewHabitModal onClose={() => setNewHabit(false)} />}

      <div className="toasts" aria-live="polite">
        {toasts.map(t => <div key={t.id} className="toast">✓ {t.msg} {t.xp ? <span className="xp">+{t.xp} XP</span> : null}</div>)}
      </div>
      {levelUp && <LevelUpOverlay lvl={levelUp} />}
    </div>
  )
}

function LevelUpOverlay({ lvl }) {
  return (
    <div className="overlay" style={{ background: 'rgba(0,0,0,.6)' }}>
      <div className="modal burst" style={{ textAlign: 'center', maxWidth: 340 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ margin: '0 auto' }} aria-hidden>
          {[...Array(8)].map((_, i) => (
            <line key={i} x1="40" y1="40" x2={40 + Math.cos(i * Math.PI / 4) * 36} y2={40 + Math.sin(i * Math.PI / 4) * 36}
              stroke="var(--accent)" strokeWidth="1.5" opacity=".5">
              <animate attributeName="opacity" values="0;.7;0" dur="1.4s" repeatCount="2" begin={`${i * 0.08}s`} />
            </line>
          ))}
          <circle cx="40" cy="40" r="22" fill="var(--accent)" />
          <text x="40" y="47" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--accent-contrast)">{lvl}</text>
        </svg>
        <h2 style={{ marginTop: 10 }}>Nivel {lvl}</h2>
        <p className="small muted" style={{ marginTop: 6 }}>Has subido de nivel. Nuevo widget y título desbloqueados.</p>
      </div>
    </div>
  )
}

// ============ PALETA DE COMANDOS ============
function Palette({ close, go, actions }) {
  const { toast } = useStore()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const CMDS = [
    { label: 'Iniciar modo enfoque', hint: 'temporizador 25 min', run: () => { actions.focus(); close() } },
    { label: 'Registrar un hábito', hint: 'ir a hábitos', run: () => { go('habitos'); close() } },
    { label: 'Crear un hábito nuevo', hint: 'formulario', run: () => { actions.newHabit(); close() } },
    { label: 'Añadir estado de ánimo', hint: 'registro rápido', run: () => { go('animo'); close() } },
    { label: 'Registrar un gasto', hint: 'finanzas', run: () => { go('finanzas'); close() } },
    { label: 'Escribir una nota', hint: 'diario', run: () => { go('diario'); close() } },
    { label: 'Crear un objetivo', hint: 'objetivos', run: () => { go('objetivos'); close() } },
    { label: 'Cerrar el día', hint: 'resumen interactivo', run: () => { actions.closeDay(); close() } },
    { label: 'Revisión semanal', hint: 'guiada', run: () => { actions.review(); close() } },
    ...NAV.map(([id, label]) => ({ label: `Ir a ${label}`, hint: 'navegación', run: () => { go(id); close() } })),
  ]
  const list = CMDS.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="overlay" style={{ placeItems: 'start center' }} onClick={e => e.target === e.currentTarget && close()}>
      <div className="palette" role="dialog" aria-label="Paleta de comandos">
        <input autoFocus placeholder="Escribe un comando o busca…" value={q}
          onChange={e => { setQ(e.target.value); setSel(0) }}
          onKeyDown={e => {
            if (e.key === 'Escape') close()
            if (e.key === 'ArrowDown') setSel(s => Math.min(list.length - 1, s + 1))
            if (e.key === 'ArrowUp') setSel(s => Math.max(0, s - 1))
            if (e.key === 'Enter' && list[sel]) list[sel].run()
          }} />
        <div className="palette-list">
          {list.map((c, i) => (
            <button key={c.label} className={`palette-item ${i === sel ? 'sel' : ''}`} onClick={c.run} onMouseEnter={() => setSel(i)}>
              <span>{c.label}</span><span className="kbd">{c.hint}</span>
            </button>
          ))}
          {!list.length && <div className="small muted" style={{ padding: 16 }}>Sin resultados para «{q}»</div>}
        </div>
      </div>
    </div>
  )
}

// ============ CIERRE DEL DÍA ============
function CloseDayModal({ onClose }) {
  const { state, dispatch, toast } = useStore()
  const [reflection, setReflection] = useState('')
  const k = todayKey()
  const today = state.days[k]
  const yest = state.days[dayKey(-1)]
  const comp = dayCompletion(today, state.habits)
  const compY = yest ? dayCompletion(yest, state.habits) : 0
  const focusMin = today.focusSessions.reduce((a, s) => a + s.minutes, 0)
  const spend = today.expenses.reduce((a, e) => a + e.amount, 0)
  const xpToday = state.habits.filter(h => today.habits?.[h.id]?.done).reduce((a, h) => a + h.xp, 0) + today.focusSessions.reduce((a, s) => a + (s.xp || 0), 0)
  const bonus = comp === 100 ? 50 : comp >= 70 ? 25 : 10
  return (
    <Modal onClose={onClose} wide>
      <h2>Cierre del día</h2>
      <p className="xs muted" style={{ marginBottom: 16 }}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · {dayArchetype(today, state.habits)}</p>
      <div className="grid g3" style={{ marginBottom: 14 }}>
        <div className="card" style={{ display: 'grid', placeItems: 'center' }}>
          <Ring pct={comp} size={90}><div style={{ textAlign: 'center' }}><b className="mono" style={{ fontSize: 18 }}>{comp}%</b><div className="xs faint">hábitos</div></div></Ring>
        </div>
        <div className="card"><div className="card-title">Hoy</div>
          <div className="stack xs" style={{ gap: 5 }}>
            <span>⏱ {Math.floor(focusMin / 60)}h {focusMin % 60}m de enfoque</span>
            <span>{['—', '😞', '😕', '😐', '🙂', '😄'][today.mood] || '—'} ánimo · ⚡ {today.energy}/10</span>
            <span>💶 {spend.toFixed(2)} € gastados</span>
            <span>🔥 racha de {globalStreak(state)} días</span>
          </div>
        </div>
        <div className="card"><div className="card-title">Vs. ayer</div>
          <div className={`big-num ${comp >= compY ? '' : ''}`} style={{ color: comp >= compY ? 'var(--ok)' : 'var(--warn)' }}>{comp >= compY ? '+' : ''}{comp - compY}%</div>
          <div className="xs faint">de consistencia</div>
          <div className="chip accent" style={{ marginTop: 8 }}>XP del día: +{xpToday}</div>
        </div>
      </div>
      <div className="field"><label className="lbl">Reflexión breve (opcional)</label>
        <textarea className="input" rows="2" value={reflection} onChange={e => setReflection(e.target.value)} placeholder="Lo mejor de hoy fue…" /></div>
      <div className="row between">
        <span className="xs muted">Bonificación de cierre: <b className="mono">+{bonus} XP</b>{comp === 100 ? ' · día completo ✦' : ''}</span>
        <button className="btn primary" onClick={() => {
          dispatch({ type: 'day', patch: { closed: true, note: reflection } })
          dispatch({ type: 'addXp', xp: bonus })
          if (new Date().getHours() < 21) dispatch({ type: 'unlockAch', id: 'a98' })
          toast('Día cerrado. Mañana empieza limpio.', bonus)
          onClose()
        }}>Cerrar el día · +{bonus} XP</button>
      </div>
    </Modal>
  )
}

// ============ ONBOARDING ============
function Onboarding({ onDone }) {
  const { state, dispatch } = useStore()
  const [step, setStep] = useState(0)
  const [selAreas, setSelAreas] = useState(['salud', 'aprendizaje'])
  const [selHabits, setSelHabits] = useState(['leer', 'agua'])
  const [selGoals, setSelGoals] = useState(['Constancia', 'Energía'])
  const [goal, setGoal] = useState('')
  const [theme, setTheme] = useState(state.theme)
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const steps = [
    { t: 'Bienvenido a LifeOS', b: <p className="muted">Vamos a montar tu sistema personal en un minuto. Sin formularios interminables — solo unas pocas decisiones.</p> },
    { t: '¿Qué quieres mejorar?', b: <div className="row wrap">{['Constancia', 'Energía', 'Enfoque', 'Sueño', 'Finanzas', 'Equilibrio'].map(x => <button key={x} className={`chip chip-btn ${selGoals.includes(x) ? 'sel' : ''}`} onClick={() => setSelGoals(s => s.includes(x) ? s.filter(y => y !== x) : [...s, x])}>{x}</button>)}</div> },
    { t: 'Elige tus áreas de vida', b: <div className="row wrap">{AREAS.map(a => <button key={a.id} className={`chip chip-btn ${selAreas.includes(a.id) ? 'sel' : ''}`} onClick={() => setSelAreas(s => s.includes(a.id) ? s.filter(x => x !== a.id) : [...s, a.id])}>{a.name}</button>)}</div> },
    { t: 'Hábitos iniciales', b: <div className="stack">{state.habits.slice(0, 6).map(h => <button key={h.id} className={`habit-row ${selHabits.includes(h.id) ? '' : ''}`} style={{ borderColor: selHabits.includes(h.id) ? 'var(--accent)' : 'var(--border)' }} onClick={() => setSelHabits(s => s.includes(h.id) ? s.filter(x => x !== h.id) : [...s, h.id])}><span>{h.icon}</span><span className="habit-name">{h.name}</span>{selHabits.includes(h.id) && <span style={{ marginLeft: 'auto' }}>✓</span>}</button>)}</div> },
    { t: 'Tu objetivo principal', b: <input className="input" autoFocus placeholder="Ej. Terminar el curso de diseño" value={goal} onChange={e => setGoal(e.target.value)} /> },
    { t: 'Elige tu tema', b: <div className="grid g2">{THEMES.map(t => <button key={t.id} className={`theme-card ${theme === t.id ? 'sel' : ''}`} onClick={() => setTheme(t.id)}><div className="small" style={{ fontWeight: 650, textAlign: 'left' }}>{t.name}</div><div className="xs faint" style={{ textAlign: 'left' }}>{t.desc}</div></button>)}</div> },
    { t: 'Tu sistema está listo', b: <div className="stack"><p className="muted">Hemos generado tu dashboard con {selHabits.length} hábitos, {selAreas.length} áreas y tu primer objetivo. Todo es ajustable después.</p><div className="row wrap">{selAreas.map(a => <span key={a} className="chip accent">{AREAS.find(x => x.id === a)?.name}</span>)}</div></div> },
  ]
  return (
    <div className="landing" style={{ justifyContent: 'center' }}>
      <div className="card anim-in" style={{ width: 'min(480px, 92vw)', textAlign: 'left' }} key={step}>
        <div className="pbar thin" style={{ marginBottom: 18 }}><div style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>{steps[step].t}</h2>
        {steps[step].b}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
          {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Atrás</button>}
          {step < steps.length - 1
            ? <button className="btn primary" onClick={() => setStep(step + 1)}>Continuar</button>
            : <button className="btn primary" onClick={() => { dispatch({ type: 'set', patch: { theme } }); onDone() }}>Entrar en LifeOS</button>}
        </div>
      </div>
    </div>
  )
}
