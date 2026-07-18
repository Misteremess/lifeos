import React, { useMemo, useState } from 'react'
import { useStore } from './store.jsx'
import { Num, Ring, Sparkline, Bars, Heatmap, Modal, Seg, Donut, Empty } from './components.jsx'
import { AREAS, DOW, dayKey, todayKey, levelFromXp, dayCompletion, globalStreak, habitStats, lifeScore, momentum, areaScores, computeInsights, dayArchetype } from './data.js'

const areaName = (id) => AREAS.find(a => a.id === id)?.name || id
const areaColor = (id) => AREAS.find(a => a.id === id)?.color || 'var(--accent)'

export function HabitRow({ h, done, onToggle }) {
  const { state } = useStore()
  const st = habitStats(state, h.id)
  return (
    <div className={`habit-row ${done ? 'done' : ''}`}>
      <button className={`hcheck ${done ? 'on' : ''}`} aria-label={`${done ? 'Desmarcar' : 'Completar'} ${h.name}`} onClick={onToggle}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l5 5L20 6"/></svg>
      </button>
      <span aria-hidden style={{ fontSize: 16 }}>{h.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="habit-name">{h.name}</div>
        <div className="xs faint">{areaName(h.area)} · {h.time || 'flexible'}</div>
      </div>
      <span className="chip">{st.streak}🔥</span>
      <span className="xs faint mono">+{h.xp} XP</span>
    </div>
  )
}

// ============ HOME (Dashboard) ============
export function Home({ go }) {
  const { state, dispatch, toast } = useStore()
  const [edit, setEdit] = useState(false)
  const [dragId, setDragId] = useState(null)
  const k = todayKey()
  const today = state.days[k]
  const ls = lifeScore(state)
  const mom = momentum(state)
  const streak = globalStreak(state)
  const lvl = levelFromXp(state.xp)
  const comp = dayCompletion(today, state.habits)
  const scores = areaScores(state)
  const ins = useMemo(() => computeInsights(state), [state.days])
  const xpToday = state.habits.filter(h => today.habits?.[h.id]?.done).reduce((a, h) => a + h.xp, 0)
    + today.focusSessions.reduce((a, s) => a + (s.xp || 20), 0)
  const heatVals = [...Array(112)].map((_, i) => {
    const d = state.days[dayKey(-(111 - i))]
    return d ? dayCompletion(d, state.habits) / 100 : 0
  })
  const focusMin = today.focusSessions.reduce((a, s) => a + s.minutes, 0)
  const weekSpend = [...Array(7)].reduce((a, _, i) => a + (state.days[dayKey(-i)]?.expenses || []).reduce((x, e) => x + e.amount, 0), 0)
  const pending = state.habits.filter(h => !today.habits?.[h.id]?.done)

  const widgets = {
    resumen: (
      <div className="card">
        <div className="card-title">Resumen del día</div>
        <div className="row" style={{ gap: 18 }}>
          <Ring pct={comp}><div style={{ textAlign: 'center' }}><div className="big-num" style={{ fontSize: 22 }}><Num value={comp} suffix="%" /></div></div></Ring>
          <div className="stack" style={{ gap: 4 }}>
            <div className="small"><b>{state.habits.length - pending.length}/{state.habits.length}</b> hábitos</div>
            <div className="small"><b>{Math.floor(focusMin / 60)}h {focusMin % 60}m</b> de enfoque</div>
            <div className="small muted">{dayArchetype(today, state.habits)}</div>
          </div>
        </div>
      </div>
    ),
    nivel: (
      <div className="card">
        <div className="card-title">Nivel · Life Score</div>
        <div className="row between">
          <div>
            <div className="big-num">Nv. <Num value={lvl.lvl} /></div>
            <div className="xs faint">{lvl.into}/{lvl.need} XP · <span className="mono">+{xpToday} hoy</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="big-num" style={{ color: 'var(--accent)' }}><Num value={ls.score} /></div>
            <div className="xs faint">Life Score</div>
          </div>
        </div>
        <div className="pbar" style={{ marginTop: 10 }}><div style={{ width: `${lvl.pct}%` }} /></div>
      </div>
    ),
    racha: (
      <div className="card">
        <div className="card-title">Racha · Momentum</div>
        <div className="row between">
          <div><div className="big-num">{streak}<span style={{ fontSize: 16 }}> días</span></div><div className="xs faint">racha global</div></div>
          <div style={{ textAlign: 'right' }}>
            <div className={`chip ${mom.delta >= 0 ? 'ok' : 'bad'}`}>{mom.delta >= 0 ? '↗' : '↘'} {mom.label}</div>
            <div className="xs faint" style={{ marginTop: 4 }}>{mom.delta >= 0 ? '+' : ''}{mom.delta}% vs semana pasada</div>
          </div>
        </div>
      </div>
    ),
    habitos: (
      <div className="card">
        <div className="card-title">Próximos hábitos <button className="btn ghost sm" onClick={() => go('habitos')}>Ver todos</button></div>
        <div className="stack" style={{ gap: 8 }}>
          {pending.slice(0, 3).map(h => <HabitRow key={h.id} h={h} done={false} onToggle={() => { dispatch({ type: 'toggleHabit', id: h.id }); toast(`${h.name} completado`, h.xp) }} />)}
          {!pending.length && <div className="small muted">Todo hecho por hoy. Bien llevado.</div>}
        </div>
      </div>
    ),
    objetivos: (
      <div className="card">
        <div className="card-title">Objetivos activos <button className="btn ghost sm" onClick={() => go('objetivos')}>Ver</button></div>
        <div className="stack">
          {state.goals.slice(0, 3).map(g => {
            const pct = Math.round(((g.current - g.start) / (g.target - g.start)) * 100)
            return <div key={g.id}>
              <div className="row between small"><span style={{ fontWeight: 550 }}>{g.name}</span><span className="mono faint">{pct}%</span></div>
              <div className="pbar thin" style={{ marginTop: 4 }}><div style={{ width: `${pct}%`, background: areaColor(g.area) }} /></div>
            </div>
          })}
        </div>
      </div>
    ),
    animo: (
      <div className="card">
        <div className="card-title">Ánimo · Energía</div>
        <div className="row between">
          <div><div className="big-num">{['—', '😞', '😕', '😐', '🙂', '😄'][today.mood] || '—'}</div><div className="xs faint">ánimo hoy</div></div>
          <div style={{ textAlign: 'right' }}>
            <div className="big-num"><Num value={today.energy} />/10</div><div className="xs faint">energía</div>
          </div>
        </div>
        <Sparkline data={[...Array(14)].map((_, i) => state.days[dayKey(-(13 - i))]?.mood || 0)} width={220} height={34} fill />
      </div>
    ),
    sueño: (
      <div className="card">
        <div className="card-title">Sueño · Pasos · Agua</div>
        <div className="g3 grid" style={{ gap: 8 }}>
          <div><div className="big-num" style={{ fontSize: 20 }}><Num value={today.sleepH || state.days[dayKey(-1)]?.sleepH || 0} decimals={1} />h</div><div className="xs faint">sueño</div></div>
          <div><div className="big-num" style={{ fontSize: 20 }}><Num value={today.steps} /></div><div className="xs faint">pasos</div></div>
          <div><div className="big-num" style={{ fontSize: 20 }}><Num value={today.water} decimals={1} />L</div><div className="xs faint">agua</div></div>
        </div>
      </div>
    ),
    enfoque: (
      <div className="card">
        <div className="card-title">Sesiones de enfoque <button className="btn ghost sm" onClick={() => go('tiempo')}>Iniciar</button></div>
        <div className="big-num">{Math.floor(focusMin / 60)}h {focusMin % 60}m</div>
        <div className="xs faint" style={{ marginBottom: 8 }}>{today.focusSessions.length} sesiones hoy</div>
        <Bars data={[...Array(7)].map((_, i) => (state.days[dayKey(-(6 - i))]?.focusSessions || []).reduce((a, s) => a + s.minutes, 0))} labels={[...Array(7)].map((_, i) => DOW[new Date(dayKey(-(6 - i)) + 'T12:00').getDay()])} width={230} height={60} highlight={6} />
      </div>
    ),
    finanzas: (
      <div className="card">
        <div className="card-title">Balance semanal <button className="btn ghost sm" onClick={() => go('finanzas')}>Ver</button></div>
        <div className="big-num"><Num value={weekSpend} decimals={0} /> €</div>
        <div className="xs faint">gastado esta semana · presupuesto ocio {state.budgets.Ocio} €</div>
      </div>
    ),
    areas: (
      <div className="card">
        <div className="card-title">Áreas de vida <button className="btn ghost sm" onClick={() => go('areas')}>Balance</button></div>
        <div className="stack" style={{ gap: 7 }}>
          {AREAS.slice(0, 5).map(a => <div key={a.id} className="row" style={{ gap: 8 }}>
            <span className="xs" style={{ width: 90 }}>{a.name}</span>
            <div className="pbar thin" style={{ flex: 1 }}><div style={{ width: `${scores[a.id]}%`, background: a.color }} /></div>
            <span className="xs mono faint" style={{ width: 24, textAlign: 'right' }}>{scores[a.id]}</span>
          </div>)}
        </div>
      </div>
    ),
    actividad: (
      <div className="card">
        <div className="card-title">Calendario de actividad</div>
        <div className="scroll-x"><Heatmap values={heatVals} /></div>
        <div className="xs faint" style={{ marginTop: 8 }}>Últimas 16 semanas · intensidad = % de hábitos completados</div>
      </div>
    ),
    insight: (
      <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
        <div className="card-title">Recomendación del día</div>
        {ins[0] && <><p className="small" style={{ fontWeight: 550 }}>{ins[0].icon} {ins[0].text}</p>
          <p className="xs muted" style={{ marginTop: 6 }}>→ {ins[0].action}</p></>}
        <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => go('insights')}>Todos los insights</button>
      </div>
    ),
  }

  const order = state.dashboardWidgets.filter(w => widgets[w])
  const move = (from, to) => {
    const arr = [...order]; const i = arr.indexOf(from), j = arr.indexOf(to)
    arr.splice(i, 1); arr.splice(j, 0, from)
    dispatch({ type: 'set', patch: { dashboardWidgets: arr } })
  }
  const allW = Object.keys(widgets)

  return (
    <div>
      <div className="page-head">
        <div><h1>Hola, {state.profile.name}</h1><div className="subtitle">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · {dayArchetype(today, state.habits)}</div></div>
        <div className="row">
          <button className={`btn ${edit ? 'primary' : ''}`} onClick={() => setEdit(!edit)}>{edit ? 'Guardar disposición' : 'Personalizar'}</button>
        </div>
      </div>
      {edit && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">Modo edición — arrastra widgets para reordenar, pulsa para añadir u ocultar</div>
          <div className="row wrap">
            {allW.map(w => <button key={w} className={`chip chip-btn ${order.includes(w) ? 'sel' : ''}`}
              onClick={() => dispatch({ type: 'set', patch: { dashboardWidgets: order.includes(w) ? order.filter(x => x !== w) : [...order, w] } })}>{w}</button>)}
          </div>
        </div>
      )}
      <div className="grid g3">
        {order.map(w => (
          <div key={w} className="anim-in" draggable={edit}
            onDragStart={() => setDragId(w)} onDragOver={e => e.preventDefault()}
            onDrop={() => { if (dragId && dragId !== w) move(dragId, w); setDragId(null) }}
            style={edit ? { cursor: 'grab' } : undefined}>
            {widgets[w]}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ MI DÍA ============
export function MyDay({ go, openCloseDay }) {
  const { state, dispatch, toast } = useStore()
  const k = todayKey()
  const today = state.days[k]
  const yest = state.days[dayKey(-1)]
  const comp = dayCompletion(today, state.habits)
  const pending = state.habits.filter(h => !today.habits?.[h.id]?.done)
  const missions = state.missions.filter(m => m.type === 'diaria')
  const mvdDone = state.mvd.every(id => today.habits?.[id]?.done)
  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  const [slots, setSlots] = useState(() => {
    const s = {}
    state.habits.forEach(h => { if (h.time) s[parseInt(h.time)] = [...(s[parseInt(h.time)] || []), h.id] })
    return s
  })
  const [drag, setDrag] = useState(null)

  return (
    <div>
      <div className="page-head">
        <div><h1>Mi día</h1><div className="subtitle">Hoy cuenta, incluso si avanzas poco.</div></div>
        <button className="btn primary" onClick={openCloseDay}>Cerrar el día</button>
      </div>
      <div className="grid g3">
        <div className="stack anim-in" style={{ gridColumn: 'span 1' }}>
          <div className="card">
            <div className="card-title">Progreso del día</div>
            <div className="row" style={{ gap: 16 }}>
              <Ring pct={comp} size={72}><b className="mono">{comp}%</b></Ring>
              <div className="stack" style={{ gap: 3 }}>
                <span className="small">{state.habits.length - pending.length}/{state.habits.length} hábitos</span>
                <span className="small">XP disponible: <b className="mono">+{pending.reduce((a, h) => a + h.xp, 0)}</b></span>
                <span className={`chip ${mvdDone ? 'ok' : ''}`}>{mvdDone ? '✓ Minimum Viable Day' : `MVD: ${state.mvd.filter(id => today.habits?.[id]?.done).length}/${state.mvd.length}`}</span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Hábitos pendientes</div>
            <div className="stack" style={{ gap: 8 }}>
              {pending.map(h => <HabitRow key={h.id} h={h} done={false} onToggle={() => { dispatch({ type: 'toggleHabit', id: h.id }); toast(`${h.name} completado`, h.xp) }} />)}
              {!pending.length && <div className="small muted">Todos los hábitos completados. Bonificación de día completo al cerrar. ✦</div>}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Misiones del día <button className="btn ghost sm" onClick={() => go('misiones')}>Todas</button></div>
            <div className="stack">
              {missions.map(m => <div key={m.id}>
                <div className="row between small"><span style={{ fontWeight: 550, textDecoration: m.done ? 'line-through' : 'none' }}>{m.name}</span><span className="mono xs faint">+{m.xp}</span></div>
                <div className="pbar thin" style={{ marginTop: 4 }}><div style={{ width: `${(m.progress / m.target) * 100}%` }} /></div>
              </div>)}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Registro rápido</div>
            <div className="row wrap">
              <button className="btn sm" onClick={() => go('animo')}>+ Ánimo</button>
              <button className="btn sm" onClick={() => go('salud')}>+ Sueño</button>
              <button className="btn sm" onClick={() => go('finanzas')}>+ Gasto</button>
              <button className="btn sm" onClick={() => go('diario')}>+ Nota</button>
              <button className="btn sm" onClick={() => {
                const f = ['Cansancio', 'Distracciones', 'Falta de tiempo'][Math.floor(Math.random() * 3)]
                dispatch({ type: 'friction', f }); toast(`Fricción registrada: ${f}`)
              }}>+ Fricción</button>
            </div>
          </div>
          {yest && <div className="card">
            <div className="card-title">Ayer</div>
            <div className="small muted">{dayCompletion(yest, state.habits)}% de hábitos · {yest.sleepH}h de sueño · ánimo {yest.mood}/5</div>
            <div className="xs faint" style={{ marginTop: 4 }}>Sugerencia: tu mejor franja de enfoque es antes de las 12:00. Reserva la mañana.</div>
          </div>}
        </div>
        <div className="card anim-in" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">Timeline — arrastra hábitos a otra hora</div>
          <div>
            {hours.map(h => (
              <div key={h} className="tl-hour" onDragOver={e => e.preventDefault()}
                onDrop={() => { if (drag) { setSlots(s => { const ns = {}; for (const key in s) ns[key] = s[key].filter(x => x !== drag); ns[h] = [...(ns[h] || []), drag]; return ns }); setDrag(null) } }}>
                <span className="h">{String(h).padStart(2, '0')}:00</span>
                <div className="stack" style={{ flex: 1, gap: 4 }}>
                  {(slots[h] || []).map(id => {
                    const hb = state.habits.find(x => x.id === id)
                    if (!hb) return null
                    const done = today.habits?.[id]?.done
                    return <div key={id} className="tl-block" draggable onDragStart={() => setDrag(id)}
                      style={{ opacity: done ? .5 : 1, cursor: 'grab', borderLeftColor: areaColor(hb.area) }}>
                      {hb.icon} {hb.name} {done && '✓'}
                    </div>
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ HÁBITOS ============
export function Habits({ go, openHabit }) {
  const { state, dispatch, toast } = useStore()
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState('todos')
  const today = state.days[todayKey()]
  const list = state.habits.filter(h => filter === 'todos' || h.area === filter)

  return (
    <div>
      <div className="page-head">
        <div><h1>Hábitos</h1><div className="subtitle">Tu constancia está creciendo.</div></div>
        <button className="btn primary" onClick={() => setShowNew(true)}>+ Nuevo hábito</button>
      </div>
      <div className="row wrap" style={{ marginBottom: 16 }}>
        <button className={`chip chip-btn ${filter === 'todos' ? 'sel' : ''}`} onClick={() => setFilter('todos')}>Todos</button>
        {AREAS.map(a => <button key={a.id} className={`chip chip-btn ${filter === a.id ? 'sel' : ''}`} onClick={() => setFilter(a.id)}>{a.name}</button>)}
      </div>
      <div className="grid g2">
        {list.map(h => {
          const st = habitStats(state, h.id)
          const done = today.habits?.[h.id]?.done
          return (
            <div key={h.id} className="card anim-in" style={{ cursor: 'pointer' }} onClick={() => openHabit(h.id)}>
              <div className="row between">
                <div className="row">
                  <button className={`hcheck ${done ? 'on' : ''}`} aria-label={`Completar ${h.name}`}
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'toggleHabit', id: h.id }); if (!done) toast(`${h.name} completado`, h.xp) }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l5 5L20 6"/></svg>
                  </button>
                  <div>
                    <div className="habit-name">{h.icon} {h.name}</div>
                    <div className="xs faint">{areaName(h.area)} · {h.type} · dificultad {'●'.repeat(h.difficulty)}{'○'.repeat(3 - h.difficulty)}</div>
                  </div>
                </div>
                <Sparkline data={[...Array(14)].map((_, i) => state.days[dayKey(-(13 - i))]?.habits?.[h.id]?.done ? 1 : 0)} width={70} height={26} color={areaColor(h.area)} />
              </div>
              <div className="divider" />
              <div className="row between xs muted">
                <span>🔥 {st.streak} racha · mejor {st.best}</span>
                <span>{st.rate}% cumplimiento</span>
                <span>fuerte los {DOW[st.bestDow]}</span>
              </div>
            </div>
          )
        })}
      </div>
      {!list.length && <Empty icon="◇" title="Sin hábitos en esta área" text="Los hábitos pequeños y repetidos construyen las áreas de tu vida. Crea el primero: p. ej. «Leer 10 minutos»." cta="Crear hábito" onCta={() => setShowNew(true)} />}
      {showNew && <NewHabitModal onClose={() => setShowNew(false)} />}
    </div>
  )
}

export function NewHabitModal({ onClose }) {
  const { dispatch, toast } = useStore()
  const [f, setF] = useState({ name: '', area: 'salud', type: 'sí/no', target: 1, unit: '', time: '', difficulty: 2, icon: '◆', freq: 'diario' })
  return (
    <Modal onClose={onClose}>
      <h2 style={{ marginBottom: 16 }}>Nuevo hábito</h2>
      <div className="field"><label className="lbl">Nombre</label><input className="input" autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Ej. Estirar 5 minutos" /></div>
      <div className="grid g2">
        <div className="field"><label className="lbl">Área</label>
          <select className="input" value={f.area} onChange={e => setF({ ...f, area: e.target.value })}>{AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div className="field"><label className="lbl">Tipo</label>
          <select className="input" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>
            {['sí/no', 'cantidad', 'duración', 'contador', 'escala', 'semanal', 'mensual', 'negativo'].map(t => <option key={t}>{t}</option>)}</select></div>
        <div className="field"><label className="lbl">Objetivo</label><input className="input" type="number" value={f.target} onChange={e => setF({ ...f, target: +e.target.value })} /></div>
        <div className="field"><label className="lbl">Unidad</label><input className="input" value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })} placeholder="min, L, pasos…" /></div>
        <div className="field"><label className="lbl">Hora recomendada</label><input className="input" type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></div>
        <div className="field"><label className="lbl">Dificultad</label>
          <select className="input" value={f.difficulty} onChange={e => setF({ ...f, difficulty: +e.target.value })}><option value={1}>Fácil (+10 XP)</option><option value={2}>Media (+15 XP)</option><option value={3}>Difícil (+25 XP)</option></select></div>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!f.name} onClick={() => {
          dispatch({ type: 'addHabit', habit: { ...f, id: 'h' + Date.now(), xp: [0, 10, 15, 25][f.difficulty] } })
          toast('Hábito creado. Empieza hoy mismo.'); onClose()
        }}>Crear hábito</button>
      </div>
    </Modal>
  )
}

export function HabitDetail({ id, back }) {
  const { state, dispatch, toast } = useStore()
  const h = state.habits.find(x => x.id === id)
  if (!h) return null
  const st = habitStats(state, id)
  const today = state.days[todayKey()]
  const done = today.habits?.[id]?.done
  const heatVals = [...Array(112)].map((_, i) => state.days[dayKey(-(111 - i))]?.habits?.[id]?.done ? 1 : 0)
  return (
    <div>
      <button className="btn ghost sm" onClick={back}>← Hábitos</button>
      <div className="page-head" style={{ marginTop: 10 }}>
        <div><h1>{h.icon} {h.name}</h1><div className="subtitle">{areaName(h.area)} · {h.type} · {h.freq} · +{h.xp} XP</div></div>
        <button className={`btn ${done ? '' : 'primary'}`} onClick={() => { dispatch({ type: 'toggleHabit', id }); if (!done) toast(`${h.name} completado`, h.xp) }}>{done ? '✓ Hecho hoy — desmarcar' : 'Completar hoy'}</button>
      </div>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card anim-in"><div className="card-title">Racha actual</div><div className="big-num">{st.streak} 🔥</div><div className="xs faint">mejor: {st.best} días</div></div>
        <div className="card anim-in"><div className="card-title">Cumplimiento</div><div className="big-num"><Num value={st.rate} suffix="%" /></div><div className="xs faint">{st.done} de {st.total} días</div></div>
        <div className="card anim-in"><div className="card-title">Día más fuerte</div><div className="big-num">{DOW[st.bestDow]}</div><div className="xs faint">horario habitual {h.time || 'flexible'}</div></div>
        <div className="card anim-in"><div className="card-title">Recuperación de racha</div><div className="big-num">{state.streakSavers}</div>
          <button className="btn sm" style={{ marginTop: 4 }} disabled={!state.streakSavers} onClick={() => { dispatch({ type: 'set', patch: { streakSavers: state.streakSavers - 1 } }); toast('Racha protegida. Una ausencia no borra tu progreso.') }}>Usar protector</button></div>
      </div>
      <div className="grid g2">
        <div className="card anim-in">
          <div className="card-title">Calendario de actividad</div>
          <div className="scroll-x"><Heatmap values={heatVals} /></div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Cumplimiento por día de la semana</div>
          <Bars data={st.byDow} labels={DOW} width={300} height={80} highlight={st.bestDow} />
        </div>
      </div>
    </div>
  )
}
