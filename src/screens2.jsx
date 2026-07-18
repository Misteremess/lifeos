import React, { useEffect, useRef, useState } from 'react'
import { useStore } from './store.jsx'
import { Num, Ring, Bars, Donut, Modal, Seg, Sparkline } from './components.jsx'
import { AREAS, DOW, dayKey, todayKey, levelFromXp, areaScores, habitStats } from './data.js'

const areaName = (id) => AREAS.find(a => a.id === id)?.name || id
const areaColor = (id) => AREAS.find(a => a.id === id)?.color || 'var(--accent)'

// ============ TIEMPO ============
export function TimeScreen({ onFocus }) {
  const { state } = useStore()
  const [mode, setMode] = useState('Pomodoro')
  const [mins, setMins] = useState(25)
  const [project, setProject] = useState('Proyecto LifeOS')
  const week = [...Array(7)].map((_, i) => state.days[dayKey(-(6 - i))])
  const weekMin = week.reduce((a, d) => a + (d?.focusSessions || []).reduce((x, s) => x + s.minutes, 0), 0)
  const byProject = {}
  for (const d of Object.values(state.days)) for (const s of d.focusSessions || []) byProject[s.project] = (byProject[s.project] || 0) + s.minutes
  const projEntries = Object.entries(byProject).sort((a, b) => b[1] - a[1])
  const today = state.days[todayKey()]
  const avgIntegrity = Math.round(week.flatMap(d => d?.focusSessions || []).reduce((a, s, _, arr) => a + s.integrity / arr.length, 0))

  return (
    <div>
      <div className="page-head">
        <div><h1>Tiempo</h1><div className="subtitle">Dónde va tu atención, va tu vida.</div></div>
      </div>
      <div className="grid g3">
        <div className="card anim-in" style={{ gridColumn: 'span 1' }}>
          <div className="card-title">Nueva sesión</div>
          <Seg options={['Pomodoro', 'Temporizador', 'Cronómetro', 'Cuenta atrás']} value={mode} onChange={setMode} />
          <div className="field" style={{ marginTop: 14 }}><label className="lbl">Duración</label>
            <div className="row wrap">{[15, 25, 45, 50, 90].map(m => <button key={m} className={`chip chip-btn ${mins === m ? 'sel' : ''}`} onClick={() => setMins(m)}>{m} min</button>)}</div>
          </div>
          <div className="field"><label className="lbl">Proyecto</label>
            <select className="input" value={project} onChange={e => setProject(e.target.value)}>
              {['Proyecto LifeOS', 'Curso de diseño', 'Cliente A', 'Lectura técnica', 'Otro'].map(p => <option key={p}>{p}</option>)}
            </select></div>
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onFocus({ mins, project, mode })}>
            Iniciar modo enfoque · +{Math.round(mins * 0.8)} XP
          </button>
          <div className="xs faint" style={{ marginTop: 10 }}>El modo enfoque oculta todo lo demás y mide tu Focus Integrity.</div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Esta semana</div>
          <div className="big-num">{Math.floor(weekMin / 60)}h {weekMin % 60}m</div>
          <div className="xs faint" style={{ marginBottom: 8 }}>tiempo de enfoque · Focus Integrity media {avgIntegrity || '—'}</div>
          <Bars data={week.map(d => (d?.focusSessions || []).reduce((a, s) => a + s.minutes, 0))}
            labels={week.map((_, i) => DOW[new Date(dayKey(-(6 - i)) + 'T12:00').getDay()])} width={260} height={70} highlight={6} />
        </div>
        <div className="card anim-in">
          <div className="card-title">Por proyecto</div>
          <div className="row" style={{ gap: 16 }}>
            <Donut size={110} data={projEntries.slice(0, 4).map(([p, v], i) => ({ label: p, value: v, color: `var(--chart${i + 1})` }))} />
            <div className="stack" style={{ gap: 5 }}>
              {projEntries.slice(0, 4).map(([p, v], i) => <div key={p} className="row xs" style={{ gap: 6 }}>
                <i style={{ width: 8, height: 8, borderRadius: 2, background: `var(--chart${i + 1})` }} />
                <span>{p}</span><span className="faint mono">{Math.round(v / 60)}h</span>
              </div>)}
            </div>
          </div>
        </div>
        <div className="card anim-in" style={{ gridColumn: 'span 3' }}>
          <div className="card-title">Sesiones de hoy</div>
          {today.focusSessions.length ? (
            <table className="tbl"><thead><tr><th>Proyecto</th><th>Duración</th><th>Interrupciones</th><th>Focus Integrity</th></tr></thead>
              <tbody>{today.focusSessions.map((s, i) => <tr key={i}>
                <td style={{ fontWeight: 550 }}>{s.project}</td><td className="mono">{s.minutes} min</td><td>{s.interruptions ?? 0}</td>
                <td><div className="row"><div className="pbar thin" style={{ width: 90 }}><div className={s.integrity > 75 ? '' : ''} style={{ width: `${s.integrity}%`, background: s.integrity > 75 ? 'var(--ok)' : 'var(--warn)' }} /></div><span className="mono xs">{s.integrity}</span></div></td>
              </tr>)}</tbody></table>
          ) : <div className="small muted">Aún no hay sesiones hoy. La primera es la que más cuesta — 15 minutos bastan para empezar.</div>}
        </div>
      </div>
    </div>
  )
}

// ============ MODO ENFOQUE ============
export function FocusMode({ config, onExit }) {
  const { dispatch, toast } = useStore()
  const total = config.mins * 60
  const [left, setLeft] = useState(total)
  const [paused, setPaused] = useState(false)
  const [interruptions, setInterruptions] = useState(0)
  const [pauses, setPauses] = useState(0)
  const [note, setNote] = useState('')
  const iv = useRef()
  useEffect(() => {
    iv.current = setInterval(() => { setLeft(l => paused ? l : Math.max(0, l - 1)) }, 1000)
    return () => clearInterval(iv.current)
  }, [paused])
  const done = left === 0
  const elapsed = total - left
  const integrity = Math.max(0, Math.round(100 - interruptions * 12 - pauses * 6 - (done ? 0 : 15)))
  const finish = () => {
    const minutes = Math.max(1, Math.round(elapsed / 60))
    const xp = Math.round(minutes * 0.8 * (integrity / 100))
    dispatch({ type: 'addFocusSession', session: { minutes, project: config.project, integrity, interruptions, xp } })
    toast(`Sesión registrada · Focus Integrity ${integrity}`, xp)
    onExit()
  }
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0')
  return (
    <div className="focus-screen">
      <div className="xs faint" style={{ letterSpacing: 2, textTransform: 'uppercase' }}>Modo enfoque · {config.project}</div>
      <div className="focus-time" aria-live="polite">{mm}:{ss}</div>
      <div className="pbar" style={{ width: 280 }}><div style={{ width: `${(elapsed / total) * 100}%` }} /></div>
      <div className="xs muted">Al terminar: +{Math.round(config.mins * 0.8)} XP · Integrity actual {integrity}</div>
      <div className="row">
        <button className="btn" onClick={() => { setPaused(!paused); if (!paused) setPauses(p => p + 1) }}>{paused ? 'Reanudar' : 'Pausar'}</button>
        <button className="btn" onClick={() => setInterruptions(i => i + 1)}>Registrar distracción ({interruptions})</button>
        <button className="btn primary" onClick={finish}>{done ? 'Completar sesión' : 'Terminar antes'}</button>
      </div>
      <input className="input" style={{ maxWidth: 300 }} placeholder="Nota rápida sin salir del flujo…" value={note} onChange={e => setNote(e.target.value)} />
      <button className="btn ghost sm" onClick={onExit}>Salir sin guardar</button>
    </div>
  )
}

// ============ OBJETIVOS ============
export function Goals({ openGoal }) {
  const { state, dispatch, toast } = useStore()
  const [showNew, setShowNew] = useState(false)
  return (
    <div>
      <div className="page-head">
        <div><h1>Objetivos</h1><div className="subtitle">Un recorrido, no una lista de deseos.</div></div>
        <button className="btn primary" onClick={() => setShowNew(true)}>+ Nuevo objetivo</button>
      </div>
      <div className="stack" style={{ gap: 14 }}>
        {state.goals.map(g => {
          const pct = Math.round(((g.current - g.start) / (g.target - g.start)) * 100)
          const daysLeft = Math.round((new Date(g.deadline) - new Date()) / 86400000)
          const nextMs = g.milestones.find(m => !m.done)
          const recentPace = g.weeklyPace.slice(-2).reduce((a, b) => a + b, 0) / 2
          const needPace = (g.target - g.current) / Math.max(1, daysLeft / 7)
          const risk = recentPace >= needPace ? 'bajo' : recentPace >= needPace * 0.6 ? 'medio' : 'alto'
          return (
            <div key={g.id} className="card anim-in" style={{ cursor: 'pointer' }} onClick={() => openGoal(g.id)}>
              <div className="row between wrap">
                <div>
                  <h2>{g.name}</h2>
                  <div className="xs faint">{areaName(g.area)} · {g.type} · prioridad {g.priority} · {daysLeft} días restantes</div>
                </div>
                <span className={`chip ${risk === 'bajo' ? 'ok' : risk === 'medio' ? 'warn' : 'bad'}`}>riesgo {risk}</span>
              </div>
              {/* milestone journey */}
              <div className="row" style={{ margin: '16px 0 6px', gap: 0 }}>
                {g.milestones.map((m, i) => (
                  <React.Fragment key={i}>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', margin: '0 auto',
                        background: m.done ? areaColor(g.area) : 'var(--surface2)', border: `2px solid ${m.done ? areaColor(g.area) : 'var(--border)'}`,
                        display: 'grid', placeItems: 'center', color: 'var(--accent-contrast)', fontSize: 11, fontWeight: 700,
                      }}>{m.done ? '✓' : i + 1}</div>
                    </div>
                    {i < g.milestones.length - 1 && <div style={{ flex: 1, height: 2, background: m.done ? areaColor(g.area) : 'var(--border)' }} />}
                  </React.Fragment>
                ))}
              </div>
              <div className="row between xs muted" style={{ marginBottom: 10 }}>
                <span>{g.milestones.filter(m => m.done).length}/{g.milestones.length} hitos</span>
                {nextMs && <span>siguiente: <b>{nextMs.name}</b></span>}
              </div>
              <div className="row between small">
                <span className="mono">{g.current} / {g.target} {g.metric}</span>
                <span className="mono faint">{pct}%</span>
              </div>
              <div className="pbar" style={{ marginTop: 4 }}><div style={{ width: `${pct}%`, background: areaColor(g.area) }} /></div>
              <div className="xs faint" style={{ marginTop: 8 }}>Ritmo necesario: {needPace.toFixed(1)} {g.metric}/sem · llevas {recentPace.toFixed(1)} · recompensa: {g.reward}</div>
            </div>
          )
        })}
      </div>
      {showNew && <NewGoalModal onClose={() => setShowNew(false)} />}
    </div>
  )
}

function NewGoalModal({ onClose }) {
  const { dispatch, toast } = useStore()
  const [f, setF] = useState({ name: '', area: 'aprendizaje', type: 'numérico', metric: '', start: 0, target: 10, deadline: dayKey(30), priority: 'media', motivation: '', reward: '' })
  return (
    <Modal onClose={onClose}>
      <h2 style={{ marginBottom: 16 }}>Nuevo objetivo</h2>
      <div className="field"><label className="lbl">Nombre</label><input autoFocus className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Ej. Leer 12 libros este año" /></div>
      <div className="field"><label className="lbl">Motivación (tu porqué)</label><input className="input" value={f.motivation} onChange={e => setF({ ...f, motivation: e.target.value })} /></div>
      <div className="grid g2">
        <div className="field"><label className="lbl">Área</label><select className="input" value={f.area} onChange={e => setF({ ...f, area: e.target.value })}>{AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div className="field"><label className="lbl">Tipo</label><select className="input" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{['numérico', 'por hitos', 'por hábitos', 'financiero', 'temporal', 'aprendizaje', 'salud', 'proyecto'].map(t => <option key={t}>{t}</option>)}</select></div>
        <div className="field"><label className="lbl">Métrica</label><input className="input" value={f.metric} onChange={e => setF({ ...f, metric: e.target.value })} placeholder="libros, €, km…" /></div>
        <div className="field"><label className="lbl">Valor objetivo</label><input className="input" type="number" value={f.target} onChange={e => setF({ ...f, target: +e.target.value })} /></div>
        <div className="field"><label className="lbl">Fecha objetivo</label><input className="input" type="date" value={f.deadline} onChange={e => setF({ ...f, deadline: e.target.value })} /></div>
        <div className="field"><label className="lbl">Recompensa</label><input className="input" value={f.reward} onChange={e => setF({ ...f, reward: e.target.value })} placeholder="Algo que te apetezca de verdad" /></div>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!f.name} onClick={() => {
          dispatch({ type: 'addGoal', goal: { ...f, id: 'g' + Date.now(), current: f.start, difficulty: 2, milestones: [{ name: '25%', done: false }, { name: '50%', done: false }, { name: '75%', done: false }, { name: 'Completado', done: false }], linkedHabits: [], weeklyPace: [0] } })
          toast('Objetivo creado. Primer paso: hoy.'); onClose()
        }}>Crear objetivo</button>
      </div>
    </Modal>
  )
}

export function GoalDetail({ id, back }) {
  const { state, dispatch, toast } = useStore()
  const g = state.goals.find(x => x.id === id)
  if (!g) return null
  const pct = Math.round(((g.current - g.start) / (g.target - g.start)) * 100)
  const daysLeft = Math.round((new Date(g.deadline) - new Date()) / 86400000)
  const recentPace = g.weeklyPace.slice(-2).reduce((a, b) => a + b, 0) / 2
  const needPace = (g.target - g.current) / Math.max(1, daysLeft / 7)
  const etaWeeks = recentPace > 0 ? (g.target - g.current) / recentPace : Infinity
  const delay = Math.round(etaWeeks * 7 - daysLeft)
  const [inc, setInc] = useState(1)
  return (
    <div>
      <button className="btn ghost sm" onClick={back}>← Objetivos</button>
      <div className="page-head" style={{ marginTop: 10 }}>
        <div><h1>{g.name}</h1><div className="subtitle">{g.motivation}</div></div>
        <div className="row">
          <input className="input" type="number" style={{ width: 80 }} value={inc} onChange={e => setInc(+e.target.value)} aria-label="Incremento" />
          <button className="btn primary" onClick={() => {
            const nv = Math.min(g.target, g.current + inc)
            const npct = ((nv - g.start) / (g.target - g.start))
            dispatch({ type: 'updateGoal', id, patch: { current: nv, weeklyPace: [...g.weeklyPace.slice(0, -1), g.weeklyPace.at(-1) + inc], milestones: g.milestones.map((m, i) => ({ ...m, done: m.done || npct >= (i + 1) / g.milestones.length })) } })
            dispatch({ type: 'addXp', xp: 15 })
            toast(nv >= g.target ? '🎉 ¡Objetivo completado!' : 'Progreso registrado', 15)
          }}>+ Registrar avance</button>
        </div>
      </div>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card anim-in"><div className="card-title">Progreso</div><div className="big-num"><Num value={pct} suffix="%" /></div><div className="xs faint mono">{g.current} / {g.target} {g.metric}</div></div>
        <div className="card anim-in"><div className="card-title">Ritmo</div><div className="big-num">{recentPace.toFixed(1)}</div><div className="xs faint">necesitas {needPace.toFixed(1)} {g.metric}/sem</div></div>
        <div className="card anim-in"><div className="card-title">Predicción</div><div className="big-num" style={{ color: delay > 0 ? 'var(--warn)' : 'var(--ok)' }}>{delay > 0 ? `+${delay}d` : `${delay}d`}</div><div className="xs faint">{delay > 0 ? 'retraso estimado' : 'de adelanto'}</div></div>
        <div className="card anim-in"><div className="card-title">Fecha límite</div><div className="big-num">{daysLeft}</div><div className="xs faint">días restantes</div></div>
      </div>
      <div className="grid g2">
        <div className="card anim-in">
          <div className="card-title">Hitos</div>
          <div className="stack">
            {g.milestones.map((m, i) => <div key={i} className="row">
              <div className={`hcheck ${m.done ? 'on' : ''}`} style={{ width: 20, height: 20 }}>{m.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l5 5L20 6"/></svg>}</div>
              <span className="small" style={{ fontWeight: m.done ? 400 : 600, opacity: m.done ? .6 : 1 }}>{m.name}</span>
            </div>)}
          </div>
          <div className="divider" />
          <div className="xs faint">Próxima mejor acción: {g.milestones.find(m => !m.done)?.name || 'celebrar 🎉'} · Recompensa final: <b>{g.reward}</b></div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Evolución semanal · contribución de hábitos</div>
          <Bars data={g.weeklyPace} labels={g.weeklyPace.map((_, i) => `S${i + 1}`)} width={300} height={80} highlight={g.weeklyPace.length - 1} />
          <div className="stack" style={{ gap: 6, marginTop: 10 }}>
            {g.linkedHabits.map(hid => {
              const h = state.habits.find(x => x.id === hid); if (!h) return null
              const st = habitStats(state, hid)
              return <div key={hid} className="row between xs"><span>{h.icon} {h.name}</span><span className="faint">{st.rate}% cumplimiento → impulsa este objetivo</span></div>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ ÁREAS DE VIDA ============
export function Areas() {
  const { state } = useStore()
  const scores = areaScores(state)
  const [sel, setSel] = useState(null)
  const size = 380, cx = size / 2, cy = size / 2
  const n = AREAS.length
  return (
    <div>
      <div className="page-head"><div><h1>Áreas de vida</h1><div className="subtitle">Life Balance — pulsa un área para ver el detalle.</div></div></div>
      <div className="grid g2">
        <div className="card anim-in" style={{ display: 'grid', placeItems: 'center' }}>
          <svg width={size} height={size} role="img" aria-label="Rueda de equilibrio vital">
            {AREAS.map((a, i) => {
              const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2
              const r = 40 + (scores[a.id] / 100) * 100
              const R = 145
              const p = (ang, rad) => [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]
              const [x0, y0] = p(a0 + 0.03, r), [x1, y1] = p(a1 - 0.03, r)
              const [bx0, by0] = p(a0 + 0.03, 38), [bx1, by1] = p(a1 - 0.03, 38)
              const [lx, ly] = p((a0 + a1) / 2, R + 18)
              return <g key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSel(a.id)}>
                <path d={`M${bx0},${by0} L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} L${bx1},${by1} A38,38 0 0 0 ${bx0},${by0}`}
                  fill={a.color} opacity={sel === a.id ? 1 : .55} stroke="var(--bg)" strokeWidth="2" />
                <text x={lx} y={ly} textAnchor="middle" fontSize="10" fill="var(--text2)" fontWeight="600">{a.name}</text>
              </g>
            })}
            <circle cx={cx} cy={cy} r="36" fill="var(--surface)" stroke="var(--border)" />
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text)">{Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / n)}</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8.5" fill="var(--text3)">EQUILIBRIO</text>
          </svg>
        </div>
        <div className="stack">
          {sel ? <AreaDetail id={sel} score={scores[sel]} onClose={() => setSel(null)} /> : (
            <div className="stack" style={{ gap: 8 }}>
              {AREAS.map(a => {
                const lvl = levelFromXp(state.areaXp[a.id] || 0)
                return <button key={a.id} className="card anim-in row between" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setSel(a.id)}>
                  <div className="row"><i style={{ width: 10, height: 10, borderRadius: 3, background: a.color }} /><b className="small">{a.name}</b><span className="chip">Nv. {lvl.lvl}</span></div>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="pbar thin" style={{ width: 110 }}><div style={{ width: `${scores[a.id]}%`, background: a.color }} /></div>
                    <span className="mono xs" style={{ width: 22 }}>{scores[a.id]}</span>
                  </div>
                </button>
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AreaDetail({ id, score, onClose }) {
  const { state } = useStore()
  const a = AREAS.find(x => x.id === id)
  const habits = state.habits.filter(h => h.area === id)
  const goals = state.goals.filter(g => g.area === id)
  const best = habits.map(h => ({ h, st: habitStats(state, h.id) })).sort((x, y) => y.st.rate - x.st.rate)[0]
  const timeMin = Object.values(state.days).slice(-7).reduce((acc, d) => acc + (d.focusSessions || []).length * 30, 0)
  const trend = score >= 60 ? 'mejorando' : score >= 45 ? 'estable' : 'necesita atención'
  return (
    <div className="card anim-in" style={{ borderTop: `3px solid ${a.color}` }}>
      <div className="row between"><h2>{a.name}</h2><button className="btn ghost sm" onClick={onClose}>Cerrar</button></div>
      <div className="row" style={{ margin: '10px 0' }}>
        <span className="big-num" style={{ color: a.color }}>{score}</span>
        <span className={`chip ${score >= 60 ? 'ok' : score >= 45 ? 'warn' : 'bad'}`}>{trend}</span>
        <span className="chip">Nv. {levelFromXp(state.areaXp[id] || 0).lvl}</span>
      </div>
      <div className="stack small" style={{ gap: 8 }}>
        <div><b>Qué funciona:</b> {best ? `${best.h.name} (${best.st.rate}% cumplimiento) es tu hábito de mayor impacto aquí.` : 'Aún no hay hábitos en esta área.'}</div>
        <div><b>Qué vigilar:</b> {score < 50 ? 'La puntuación lleva dos semanas por debajo de tu media. Un pequeño ajuste puede mejorar esta semana.' : 'Nada crítico. Mantén el ritmo actual.'}</div>
        <div><b>Objetivos vinculados:</b> {goals.length ? goals.map(g => g.name).join(', ') : 'ninguno todavía'}</div>
        <div><b>Acción sugerida:</b> {habits.length ? `Prioriza «${habits[0].name}» los próximos 3 días.` : `Crea un hábito mínimo para ${a.name.toLowerCase()} — 10 minutos bastan.`}</div>
      </div>
    </div>
  )
}
