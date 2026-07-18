import React, { useMemo, useState } from 'react'
import { useStore } from './store.jsx'
import { Num, Ring, Sparkline, Bars, Donut, Modal, Seg, Heatmap } from './components.jsx'
import { AREAS, DOW, THEMES, ACHIEVEMENTS, dayKey, todayKey, levelFromXp, dayCompletion, globalStreak, lifeScore, momentum, areaScores, computeInsights, habitStats, dayArchetype } from './data.js'

// ============ ESTADÍSTICAS ============
export function Stats() {
  const { state } = useStore()
  const [period, setPeriod] = useState('Semana')
  const n = period === 'Semana' ? 7 : period === 'Mes' ? 30 : 42
  const days = [...Array(n)].map((_, i) => ({ k: dayKey(-(n - 1 - i)), d: state.days[dayKey(-(n - 1 - i))] })).filter(x => x.d)
  const comp = days.map(x => dayCompletion(x.d, state.habits))
  const avg = Math.round(comp.reduce((a, b) => a + b, 0) / Math.max(1, comp.length))
  const prevDays = [...Array(n)].map((_, i) => state.days[dayKey(-(2 * n - 1 - i))]).filter(Boolean)
  const prevAvg = Math.round(prevDays.reduce((a, d) => a + dayCompletion(d, state.habits), 0) / Math.max(1, prevDays.length))
  const byDow = [0, 1, 2, 3, 4, 5, 6].map(dw => {
    const ds = days.filter(x => new Date(x.k + 'T12:00').getDay() === dw)
    return ds.length ? Math.round(ds.reduce((a, x) => a + dayCompletion(x.d, state.habits), 0) / ds.length) : 0
  })
  const worstDow = byDow.indexOf(Math.min(...byDow.filter(Boolean)))
  const focusByDow = [0, 1, 2, 3, 4, 5, 6].map(dw => {
    const ds = days.filter(x => new Date(x.k + 'T12:00').getDay() === dw)
    return ds.length ? Math.round(ds.reduce((a, x) => a + x.d.focusSessions.reduce((y, s) => y + s.minutes, 0), 0) / ds.length) : 0
  })
  // correlation matrix (simple sign strength)
  const corr = (fa, fb) => {
    const va = days.map(x => fa(x.d)), vb = days.map(x => fb(x.d))
    const ma = va.reduce((a, b) => a + b, 0) / va.length, mb = vb.reduce((a, b) => a + b, 0) / vb.length
    let num = 0, da = 0, db = 0
    va.forEach((v, i) => { num += (v - ma) * (vb[i] - mb); da += (v - ma) ** 2; db += (vb[i] - mb) ** 2 })
    return da && db ? num / Math.sqrt(da * db) : 0
  }
  const METRICS = [
    ['Sueño', d => d.sleepH], ['Energía', d => d.energy], ['Ánimo', d => d.mood],
    ['Hábitos', d => dayCompletion(d, state.habits)], ['Enfoque', d => d.focusSessions.reduce((a, s) => a + s.minutes, 0)],
  ]
  // habit-vs-mood impact
  const habitImpact = state.habits.map(h => {
    const withH = days.filter(x => x.d.habits?.[h.id]?.done), without = days.filter(x => !x.d.habits?.[h.id]?.done)
    const dm = (withH.reduce((a, x) => a + x.d.mood, 0) / Math.max(1, withH.length)) - (without.reduce((a, x) => a + x.d.mood, 0) / Math.max(1, without.length))
    return { h, dm }
  }).sort((a, b) => b.dm - a.dm)
  const records = useMemo(() => {
    const all = Object.entries(state.days)
    const mostHabits = all.reduce((best, [k, d]) => { const c = Object.values(d.habits).filter(h => h.done).length; return c > best.v ? { k, v: c } : best }, { v: 0 })
    const mostFocus = all.reduce((best, [k, d]) => { const c = d.focusSessions.reduce((a, s) => a + s.minutes, 0); return c > best.v ? { k, v: c } : best }, { v: 0 })
    return { mostHabits, mostFocus }
  }, [state.days])

  return (
    <div>
      <div className="page-head">
        <div><h1>Estadísticas</h1><div className="subtitle">Cada gráfico responde a una pregunta.</div></div>
        <Seg options={['Semana', 'Mes', 'Todo']} value={period} onChange={setPeriod} />
      </div>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card anim-in"><div className="card-title">Consistencia</div><div className="big-num"><Num value={avg} suffix="%" /></div>
          <span className={`chip ${avg >= prevAvg ? 'ok' : 'bad'}`}>{avg >= prevAvg ? '↗' : '↘'} {Math.abs(avg - prevAvg)}% vs anterior</span></div>
        <div className="card anim-in"><div className="card-title">Racha</div><div className="big-num">{globalStreak(state)}</div><div className="xs faint">días seguidos con actividad</div></div>
        <div className="card anim-in"><div className="card-title">XP total</div><div className="big-num mono"><Num value={state.xp} /></div><div className="xs faint">nivel {levelFromXp(state.xp).lvl}</div></div>
        <div className="card anim-in"><div className="card-title">Récords</div>
          <div className="xs">🏅 {records.mostHabits.v} hábitos en un día<br />⏱ {Math.round(records.mostFocus.v / 60)}h de enfoque máx.</div></div>
      </div>
      <div className="grid g2">
        <div className="card anim-in">
          <div className="card-title">¿Qué días abandono mis rutinas?</div>
          <Bars data={byDow} labels={DOW} width={320} height={90} highlight={worstDow} color="var(--bad)" />
          <div className="xs muted">Los {DOW[worstDow]} son tu punto débil ({byDow[worstDow]}% de cumplimiento). Prepara ese día la noche anterior.</div>
        </div>
        <div className="card anim-in">
          <div className="card-title">¿Cuándo soy más productivo?</div>
          <Bars data={focusByDow} labels={DOW} width={320} height={90} highlight={focusByDow.indexOf(Math.max(...focusByDow))} color="var(--chart1)" />
          <div className="xs muted">Media de minutos de enfoque por día de la semana.</div>
        </div>
        <div className="card anim-in">
          <div className="card-title">¿Qué hábitos influyen más en mi ánimo?</div>
          <div className="stack" style={{ gap: 7 }}>
            {habitImpact.slice(0, 5).map(({ h, dm }) => (
              <div key={h.id} className="row between small">
                <span>{h.icon} {h.name}</span>
                <div className="row" style={{ gap: 6 }}>
                  <div className="pbar thin" style={{ width: 100 }}><div style={{ width: `${Math.min(100, Math.abs(dm) * 100)}%`, background: dm > 0 ? 'var(--ok)' : 'var(--bad)' }} /></div>
                  <span className="mono xs faint" style={{ width: 38 }}>{dm > 0 ? '+' : ''}{dm.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Mapa de correlaciones</div>
          <div className="scroll-x">
            <table className="tbl" style={{ fontSize: 11 }}>
              <thead><tr><th></th>{METRICS.map(([n]) => <th key={n}>{n}</th>)}</tr></thead>
              <tbody>{METRICS.map(([na, fa]) => <tr key={na}><td style={{ fontWeight: 600 }}>{na}</td>
                {METRICS.map(([nb, fb]) => {
                  const c = na === nb ? 1 : corr(fa, fb)
                  return <td key={nb}><span style={{
                    display: 'inline-block', width: 34, textAlign: 'center', padding: '2px 0', borderRadius: 5, fontFamily: 'var(--font-mono)',
                    background: `color-mix(in srgb, ${c > 0 ? 'var(--ok)' : 'var(--bad)'} ${Math.abs(c) * 45}%, var(--surface2))`,
                  }}>{c.toFixed(1)}</span></td>
                })}</tr>)}</tbody>
            </table>
          </div>
          <div className="xs faint" style={{ marginTop: 6 }}>Correlación entre tus métricas ({period.toLowerCase()}). No implica causalidad.</div>
        </div>
        <div className="card anim-in" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">Evolución de la consistencia</div>
          <Sparkline data={comp} width={700} height={70} fill />
        </div>
      </div>
    </div>
  )
}

// ============ INSIGHTS ============
export function Insights() {
  const { state } = useStore()
  const ins = useMemo(() => computeInsights(state), [state.days])
  return (
    <div>
      <div className="page-head"><div><h1>Insights</h1><div className="subtitle">Lo que tus datos intentan decirte, en claro.</div></div></div>
      <div className="grid g2">
        {ins.map((x, i) => (
          <div key={i} className="card anim-in" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22 }} aria-hidden>{x.icon}</span>
              <div>
                <p className="small" style={{ fontWeight: 600 }}>{x.text}</p>
                <p className="xs muted" style={{ marginTop: 6 }}>Acción recomendada → {x.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ REVISIÓN SEMANAL ============
export function WeeklyReview({ onDone }) {
  const { state, dispatch, toast } = useStore()
  const [step, setStep] = useState(0)
  const [reflection, setReflection] = useState('')
  const [prios, setPrios] = useState(['', '', ''])
  const week = [...Array(7)].map((_, i) => state.days[dayKey(-i)]).filter(Boolean)
  const comp = Math.round(week.reduce((a, d) => a + dayCompletion(d, state.habits), 0) / week.length)
  const focusH = (week.reduce((a, d) => a + d.focusSessions.reduce((x, s) => x + s.minutes, 0), 0) / 60).toFixed(1)
  const sleepAvg = (week.reduce((a, d) => a + d.sleepH, 0) / week.length).toFixed(1)
  const moodAvg = (week.reduce((a, d) => a + d.mood, 0) / week.length).toFixed(1)
  const spend = week.reduce((a, d) => a + d.expenses.reduce((x, e) => x + e.amount, 0), 0).toFixed(0)
  const strongest = state.habits.map(h => ({ h, st: habitStats(state, h.id) })).sort((a, b) => b.st.rate - a.st.rate)
  const steps = [
    { title: 'Resumen de la semana', body: (
      <div className="grid g3">
        {[['Consistencia', comp + '%'], ['Enfoque', focusH + 'h'], ['Sueño medio', sleepAvg + 'h'], ['Ánimo medio', moodAvg + '/5'], ['Gastos', spend + ' €'], ['Racha', globalStreak(state) + ' días']].map(([l, v]) => (
          <div key={l} className="card"><div className="card-title">{l}</div><div className="big-num" style={{ fontSize: 22 }}>{v}</div></div>
        ))}
      </div>
    )},
    { title: 'Hábitos: fuertes y débiles', body: (
      <div className="stack">
        <div className="small"><b>Más fuertes:</b> {strongest.slice(0, 3).map(x => `${x.h.icon} ${x.h.name} (${x.st.rate}%)`).join(' · ')}</div>
        <div className="small"><b>Necesitan apoyo:</b> {strongest.slice(-2).map(x => `${x.h.icon} ${x.h.name} (${x.st.rate}%)`).join(' · ')}</div>
        <div className="xs muted">Tu progreso no depende de un día perfecto. Elige un solo hábito débil para reforzar.</div>
      </div>
    )},
    { title: 'Reflexión', body: (
      <div>
        <p className="small muted" style={{ marginBottom: 8 }}>¿Cuál fue tu mayor victoria? ¿Qué harías distinto?</p>
        <textarea className="input" rows="4" value={reflection} onChange={e => setReflection(e.target.value)} placeholder="Esta semana…" autoFocus />
      </div>
    )},
    { title: 'Plan de la próxima semana', body: (
      <div className="stack">
        {prios.map((p, i) => <input key={i} className="input" placeholder={`Prioridad ${i + 1}`} value={p} onChange={e => setPrios(ps => ps.map((x, j) => j === i ? e.target.value : x))} />)}
        <div className="xs muted">Misión semanal sugerida: 4 sesiones de enfoque · Riesgo: los {DOW[2]} · Recompensa al completar: +100 XP y 30 monedas.</div>
      </div>
    )},
  ]
  return (
    <Modal onClose={onDone} wide>
      <div className="row between" style={{ marginBottom: 4 }}>
        <h2>Revisión semanal</h2><span className="xs faint">{step + 1} / {steps.length}</span>
      </div>
      <div className="pbar thin" style={{ marginBottom: 16 }}><div style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text2)' }}>{steps[step].title}</h2>
      {steps[step].body}
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Atrás</button>}
        {step < steps.length - 1
          ? <button className="btn primary" onClick={() => setStep(step + 1)}>Continuar</button>
          : <button className="btn primary" onClick={() => {
              dispatch({ type: 'set', patch: { weeklyReviews: [...state.weeklyReviews, { week: todayKey(), reflection, prios, focusH }] } })
              dispatch({ type: 'addXp', xp: 80 })
              const m = state.missions.find(m => m.id === 'm6')
              if (m && !m.done && m.progress + 1 >= m.target) dispatch({ type: 'completeMission', id: 'm6' })
              toast('Revisión completada. Semana cerrada con intención.', 80)
              onDone()
            }}>Terminar · +80 XP</button>}
      </div>
    </Modal>
  )
}

// ============ MISIONES ============
export function Missions({ openReview }) {
  const { state, dispatch, toast } = useStore()
  const groups = ['diaria', 'semanal', 'mensual', 'especial']
  return (
    <div>
      <div className="page-head">
        <div><h1>Misiones</h1><div className="subtitle">Retos concretos, recompensas reales.</div></div>
        <button className="btn" onClick={openReview}>Iniciar revisión semanal</button>
      </div>
      <div className="grid g2">
        {groups.map(g => (
          <div key={g} className="card anim-in">
            <div className="card-title">{g.charAt(0).toUpperCase() + g.slice(1)}{g !== 'especial' ? 's' : 'es'}</div>
            <div className="stack">
              {state.missions.filter(m => m.type === g).map(m => (
                <div key={m.id} className="habit-row" style={{ opacity: m.done ? .6 : 1 }}>
                  <div style={{ flex: 1 }}>
                    <div className="small" style={{ fontWeight: 600, textDecoration: m.done ? 'line-through' : 'none' }}>{m.name}</div>
                    <div className="row" style={{ marginTop: 5, gap: 8 }}>
                      <div className="pbar thin" style={{ flex: 1 }}><div style={{ width: `${(m.progress / m.target) * 100}%`, background: m.done ? 'var(--ok)' : 'var(--accent)' }} /></div>
                      <span className="mono xs faint">{m.progress}/{m.target}</span>
                    </div>
                  </div>
                  {m.done ? <span className="chip ok">✓ +{m.xp} XP</span> :
                    m.progress >= m.target - 1 && !m.done ?
                      <button className="btn sm primary" onClick={() => { dispatch({ type: 'completeMission', id: m.id }); toast(`Misión completada: ${m.name}`, m.xp) }}>Reclamar</button>
                      : <span className="xs faint mono">+{m.xp}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="card anim-in" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">Combos activos</div>
          <div className="grid g3">
            {[['🌙 + 💪 + ⏱', 'Dormir bien + entrenar + sesión de enfoque', '+40 XP extra', true],
              ['📖 + ✍️ + 📋', 'Leer + tomar notas + completar revisión', '+30 XP extra', false],
              ['👟 + 💧 + 🌙', 'Caminar + beber agua + dormir bien', '+25 XP extra', true]].map(([ic, desc, bonus, active]) => (
              <div key={desc} className="card" style={{ background: 'var(--surface2)', border: active ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{ic}</div>
                <div className="xs" style={{ fontWeight: 600 }}>{desc}</div>
                <div className="xs faint" style={{ marginTop: 4 }}>{bonus} {active && '· en curso hoy'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ LOGROS ============
export function Achievements() {
  const { state, dispatch, toast } = useStore()
  const [cat, setCat] = useState('Todos')
  const cats = ['Todos', ...new Set(ACHIEVEMENTS.map(a => a.cat))]
  const list = ACHIEVEMENTS.filter(a => cat === 'Todos' || a.cat === cat)
  const unlocked = state.unlockedAchievements
  return (
    <div>
      <div className="page-head">
        <div><h1>Logros</h1><div className="subtitle">{unlocked.length} de {ACHIEVEMENTS.length} desbloqueados</div></div>
        <button className="btn" onClick={() => {
          const next = ACHIEVEMENTS.find(a => !unlocked.includes(a.id) && a.rarity !== 'secreto')
          if (next) { dispatch({ type: 'unlockAch', id: next.id }); toast(`🏅 Logro desbloqueado: ${next.name}`, 50) }
        }}>Desbloquear demo</button>
      </div>
      <div className="row wrap" style={{ marginBottom: 16 }}>
        {cats.map(c => <button key={c} className={`chip chip-btn ${cat === c ? 'sel' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      <div className="grid g3">
        {list.map(a => {
          const has = unlocked.includes(a.id)
          const secret = a.rarity === 'secreto' && !has
          return (
            <div key={a.id} className={`card anim-in ach ${has ? '' : 'locked'}`}>
              <div className="row">
                <div className="badge-hex" style={has ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)' } : {}}>
                  <span className={`rar-${a.rarity.replace(' ', '-')}`}>{a.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="small" style={{ fontWeight: 650 }}>{secret ? '???' : a.name}</div>
                  <div className="xs faint">{secret ? 'Logro secreto — sigue explorando' : a.desc}</div>
                </div>
              </div>
              <div className="row between" style={{ marginTop: 10 }}>
                <span className={`chip rar-${a.rarity.replace(' ', '-')}`}>{a.rarity}</span>
                <span className="xs faint">{a.pct}% lo tienen{has ? ' · ✓ tuyo' : ''}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============ PERFIL ============
export function Profile() {
  const { state, dispatch, toast } = useStore()
  const lvl = levelFromXp(state.xp)
  const scores = areaScores(state)
  const topAreas = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const timeline = [
    { d: dayKey(-2), t: '🏅 Logro: Escritor semanal' },
    { d: dayKey(-5), t: '⬆️ Subiste a nivel ' + lvl.lvl },
    { d: dayKey(-7), t: '📋 Revisión semanal completada' },
    { d: dayKey(-11), t: '🔥 Mejor racha personal: 12 días' },
    { d: dayKey(-20), t: '🎯 Hito: mitad del ahorro para el viaje' },
    { d: dayKey(-42), t: '✦ Te uniste a LifeOS' },
  ]
  return (
    <div>
      <div className="page-head"><div><h1>Perfil</h1></div>
        <button className="btn" onClick={() => toast('Tarjeta de progreso lista para compartir (próximamente)')}>Compartir progreso</button></div>
      <div className="grid g3">
        <div className="card anim-in" style={{ textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-contrast)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, margin: '6px auto 10px', border: '3px solid var(--accent-soft)' }}>{state.profile.name[0]}</div>
          <h2>{state.profile.name}</h2>
          <div className="chip accent" style={{ marginTop: 6 }}>{state.profile.title}</div>
          <div className="divider" />
          <div className="row" style={{ justifyContent: 'space-around' }}>
            <div><div className="big-num" style={{ fontSize: 20 }}>{lvl.lvl}</div><div className="xs faint">nivel</div></div>
            <div><div className="big-num" style={{ fontSize: 20 }}>{globalStreak(state)}</div><div className="xs faint">racha</div></div>
            <div><div className="big-num" style={{ fontSize: 20 }}>{Object.keys(state.days).length}</div><div className="xs faint">días activos</div></div>
            <div><div className="big-num" style={{ fontSize: 20 }}>{state.coins}</div><div className="xs faint">monedas</div></div>
          </div>
          <div className="pbar" style={{ marginTop: 12 }}><div style={{ width: `${lvl.pct}%` }} /></div>
          <div className="xs faint" style={{ marginTop: 4 }}>{lvl.into} / {lvl.need} XP hasta nivel {lvl.lvl + 1}</div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Atributos</div>
          <div className="stack" style={{ gap: 7 }}>
            {Object.entries(state.attributes).map(([k, v]) => (
              <div key={k} className="row" style={{ gap: 8 }}>
                <span className="xs" style={{ width: 90 }}>{k}</span>
                <div className="pbar thin" style={{ flex: 1 }}><div style={{ width: `${v}%` }} /></div>
                <span className="mono xs faint" style={{ width: 22, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="xs faint" style={{ marginTop: 10 }}>Evolucionan según tus registros reales, no se editan a mano.</div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Recompensas personales · {state.coins} monedas</div>
          <div className="stack" style={{ gap: 8 }}>
            {state.rewards.map(r => (
              <div key={r.id} className="row between">
                <span className="small">{r.icon} {r.name}</span>
                <button className="btn sm" disabled={state.coins < r.cost} onClick={() => { dispatch({ type: 'redeem', cost: r.cost }); toast(`Recompensa canjeada: ${r.name}. Disfrútala sin culpa.`) }}>{r.cost} ⬡</button>
              </div>
            ))}
          </div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Áreas más desarrolladas</div>
          {topAreas.map(([id, v]) => {
            const a = AREAS.find(x => x.id === id)
            return <div key={id} className="row between small" style={{ padding: '5px 0' }}>
              <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: a.color, marginRight: 8 }} />{a.name}</span>
              <span className="mono faint">{v} · Nv. {levelFromXp(state.areaXp[id] || 0).lvl}</span>
            </div>
          })}
        </div>
        <div className="card anim-in" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">Life Timeline</div>
          <div className="stack" style={{ gap: 0 }}>
            {timeline.map((t, i) => (
              <div key={i} className="row" style={{ gap: 12, padding: '7px 0', borderLeft: '2px solid var(--border)', paddingLeft: 14, marginLeft: 6, position: 'relative' }}>
                <i style={{ position: 'absolute', left: -5, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                <span className="xs faint mono" style={{ width: 80 }}>{t.d}</span>
                <span className="small">{t.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ AJUSTES ============
export function Settings() {
  const { state, dispatch, toast } = useStore()
  const download = (name, content, type) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click()
  }
  const THEME_COLORS = {
    porcelain: ['#f6f4f0', '#fdfcfa', '#24242a', '#5b7a99'], obsidian: ['#101014', '#1b1b22', '#ececf1', '#dcdce4'],
    midnight: ['#0d1420', '#152034', '#e4ecf5', '#6fc3d1'], forest: ['#131a15', '#1c2820', '#e9ede5', '#a3bfa0'],
    solar: ['#f3ead9', '#faf4e8', '#3a2e22', '#c08a3e'], monochrome: ['#fafafa', '#ffffff', '#111111', '#666666'],
    oled: ['#000000', '#00e5ff', '#39ff8e', '#b44dff'],
  }
  return (
    <div>
      <div className="page-head"><div><h1>Ajustes</h1></div></div>
      <div className="grid g2">
        <div className="card anim-in" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">Tema — previsualización instantánea</div>
          <div className="grid g3">
            {THEMES.map(t => (
              <button key={t.id} className={`theme-card ${state.theme === t.id ? 'sel' : ''}`} onClick={() => { dispatch({ type: 'set', patch: { theme: t.id } }); toast(`Tema ${t.name} aplicado`) }}>
                <div className="swatch-row">{THEME_COLORS[t.id].map((c, i) => <i key={i} style={{ background: c }} />)}</div>
                <div className="small" style={{ fontWeight: 650, textAlign: 'left' }}>{t.name}</div>
                <div className="xs faint" style={{ textAlign: 'left' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Preferencias</div>
          {[['Idioma', ['Español', 'English']], ['Inicio de semana', ['Lunes', 'Domingo']], ['Formato horario', ['24 h', '12 h']], ['Moneda', ['EUR €', 'USD $']], ['Unidades', ['Métrico', 'Imperial']]].map(([l, opts]) => (
            <div className="field row between" key={l}><label className="lbl" style={{ margin: 0 }}>{l}</label>
              <select className="input" style={{ width: 130 }}>{opts.map(o => <option key={o}>{o}</option>)}</select></div>
          ))}
        </div>
        <div className="card anim-in">
          <div className="card-title">Accesibilidad y gamificación</div>
          {['Reducir movimiento', 'Texto grande', 'Alto contraste', 'Celebraciones discretas', 'Notificaciones', 'Mostrar XP en la interfaz'].map(l => (
            <label key={l} className="row between small" style={{ padding: '7px 0', cursor: 'pointer' }}>{l}<input type="checkbox" defaultChecked={l.includes('XP') || l.includes('Celebr') || l.includes('Notif')} /></label>
          ))}
        </div>
        <div className="card anim-in">
          <div className="card-title">Datos</div>
          <div className="row wrap">
            <button className="btn" onClick={() => download('lifeos-export.json', JSON.stringify(state, null, 2), 'application/json')}>Exportar JSON</button>
            <button className="btn" onClick={() => {
              const rows = [['fecha', 'sueño_h', 'energía', 'ánimo', 'pasos', 'hábitos_completados']]
              Object.entries(state.days).sort().forEach(([k, d]) => rows.push([k, d.sleepH, d.energy, d.mood, d.steps, Object.values(d.habits).filter(h => h.done).length]))
              download('lifeos-export.csv', rows.map(r => r.join(',')).join('\n'), 'text/csv')
            }}>Exportar CSV</button>
            <button className="btn" onClick={() => { if (confirm('¿Restablecer todos tus datos? Esta acción no se puede deshacer.')) dispatch({ type: 'reset' }) }} style={{ color: 'var(--bad)' }}>Restablecer datos</button>
          </div>
          <div className="xs faint" style={{ marginTop: 10 }}>Tus datos viven solo en este dispositivo (localStorage). Copias de seguridad e integraciones: próximamente.</div>
        </div>
      </div>
    </div>
  )
}
