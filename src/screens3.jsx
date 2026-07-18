import React, { useMemo, useState } from 'react'
import { useStore } from './store.jsx'
import { Num, Sparkline, Bars, Donut, Modal, Seg, Heatmap, Empty } from './components.jsx'
import { DOW, dayKey, todayKey } from './data.js'

const MOODS = ['😞', '😕', '😐', '🙂', '😄']
const MOOD_NAMES = ['Muy bajo', 'Bajo', 'Neutro', 'Bien', 'Muy bien']

// ============ SALUD Y ENERGÍA ============
export function Health() {
  const { state, dispatch, toast } = useStore()
  const k = todayKey()
  const today = state.days[k]
  const [sleep, setSleep] = useState(today.sleepH || 7.5)
  const [energy, setEnergy] = useState(today.energy || 6)
  const [water, setWater] = useState(today.water || 0)
  const [steps, setSteps] = useState(today.steps || 0)
  const days14 = [...Array(14)].map((_, i) => state.days[dayKey(-(13 - i))]).filter(Boolean)
  const sleepAvg = (days14.reduce((a, d) => a + d.sleepH, 0) / days14.length).toFixed(1)
  const goodSleepDays = days14.filter(d => d.sleepH >= 7)
  const compGood = goodSleepDays.length ? Math.round(goodSleepDays.reduce((a, d) => a + Object.values(d.habits).filter(h => h.done).length, 0) / goodSleepDays.length) : 0

  return (
    <div>
      <div className="page-head"><div><h1>Salud y energía</h1><div className="subtitle">Tendencias personales, no diagnósticos.</div></div></div>
      <div className="grid g3">
        <div className="card anim-in">
          <div className="card-title">Registrar hoy</div>
          <div className="field"><label className="lbl">Sueño: {sleep} h</label>
            <input type="range" min="3" max="11" step="0.5" value={sleep} onChange={e => setSleep(+e.target.value)} style={{ width: '100%' }} aria-label="Horas de sueño" /></div>
          <div className="field"><label className="lbl">Energía: {energy}/10</label>
            <input type="range" min="1" max="10" value={energy} onChange={e => setEnergy(+e.target.value)} style={{ width: '100%' }} aria-label="Energía" /></div>
          <div className="grid g2">
            <div className="field"><label className="lbl">Agua (L)</label><input className="input" type="number" step="0.25" value={water} onChange={e => setWater(+e.target.value)} /></div>
            <div className="field"><label className="lbl">Pasos</label><input className="input" type="number" value={steps} onChange={e => setSteps(+e.target.value)} /></div>
          </div>
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
            dispatch({ type: 'day', patch: { sleepH: sleep, energy, water, steps } })
            dispatch({ type: 'addXp', xp: 10 }); toast('Registro de salud guardado', 10)
          }}>Guardar registro · +10 XP</button>
        </div>
        <div className="card anim-in">
          <div className="card-title">Sueño — 14 días</div>
          <div className="big-num">{sleepAvg}h</div>
          <div className="xs faint" style={{ marginBottom: 6 }}>media · objetivo 8h</div>
          <Bars data={days14.map(d => d.sleepH)} labels={days14.map((_, i) => i % 2 ? '' : DOW[new Date(dayKey(-(13 - i)) + 'T12:00').getDay()])} width={280} height={70} highlight={13} />
          <div className="xs muted" style={{ marginTop: 8 }}>💡 Los días que duermes 7h+ completas de media <b>{compGood}</b> hábitos.</div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Energía y estrés</div>
          <div className="row" style={{ gap: 20 }}>
            <div><div className="big-num"><Num value={today.energy || energy} />/10</div><div className="xs faint">energía</div></div>
            <div><div className="big-num"><Num value={today.stress || 4} />/10</div><div className="xs faint">estrés</div></div>
          </div>
          <Sparkline data={days14.map(d => d.energy)} width={260} height={40} fill color="var(--chart2)" />
          <div className="xs faint">energía últimos 14 días</div>
        </div>
        <div className="card anim-in"><div className="card-title">Pasos</div>
          <div className="big-num"><Num value={today.steps || steps} /></div>
          <Sparkline data={days14.map(d => d.steps)} width={240} height={40} color="var(--chart3)" fill />
        </div>
        <div className="card anim-in"><div className="card-title">Horario de sueño</div>
          <div className="small">🛏 {today.bed || state.days[dayKey(-1)]?.bed || '—'} → ☀️ {today.wake || state.days[dayKey(-1)]?.wake || '—'}</div>
          <div className="xs faint" style={{ marginTop: 6 }}>Calidad media: {(days14.reduce((a, d) => a + d.sleepQuality, 0) / days14.length).toFixed(1)}/5</div>
          <div className="xs muted" style={{ marginTop: 8 }}>Tu hora de acostarte varía ±40 min. Un horario más estable suele mejorar la energía matinal.</div>
        </div>
        <div className="card anim-in"><div className="card-title">Correlación destacada</div>
          <p className="small" style={{ fontWeight: 550 }}>Tus mejores sesiones de concentración ocurren antes de las 12:00.</p>
          <p className="xs muted" style={{ marginTop: 6 }}>→ Protege la franja 9:00–12:00 para el trabajo profundo.</p>
        </div>
      </div>
    </div>
  )
}

// ============ ESTADO DE ÁNIMO ============
export function Mood() {
  const { state, dispatch, toast } = useStore()
  const today = state.days[todayKey()]
  const [sel, setSel] = useState(today.mood || 0)
  const [tags, setTags] = useState(today.moodTags || [])
  const [note, setNote] = useState('')
  const [detail, setDetail] = useState(false)
  const days28 = [...Array(28)].map((_, i) => ({ k: dayKey(-(27 - i)), d: state.days[dayKey(-(27 - i))] }))
  const TAGS = ['tranquilo', 'motivado', 'cansado', 'estresado', 'contento', 'disperso', 'enfocado', 'social']
  const tagBoost = useMemo(() => {
    const m = {}
    days28.forEach(({ d }) => d?.moodTags?.forEach(t => { m[t] = m[t] || { n: 0, s: 0 }; m[t].n++; m[t].s += d.mood }))
    return Object.entries(m).map(([t, v]) => ({ t, avg: v.s / v.n, n: v.n })).sort((a, b) => b.avg - a.avg)
  }, [state.days])

  return (
    <div>
      <div className="page-head"><div><h1>Estado de ánimo</h1><div className="subtitle">Nombrar lo que sientes ya es avanzar.</div></div></div>
      <div className="grid g3">
        <div className="card anim-in">
          <div className="card-title">¿Cómo te sientes?</div>
          <div className="row" style={{ justifyContent: 'space-between', margin: '8px 0 14px' }}>
            {MOODS.map((m, i) => (
              <button key={i} aria-label={MOOD_NAMES[i]} onClick={() => setSel(i + 1)}
                style={{ fontSize: 26, padding: 8, borderRadius: 12, background: sel === i + 1 ? 'var(--accent-soft)' : 'transparent', transform: sel === i + 1 ? 'scale(1.2)' : 'none', transition: 'all 200ms' }}>{m}</button>
            ))}
          </div>
          <div className="row wrap" style={{ marginBottom: 12 }}>
            {TAGS.map(t => <button key={t} className={`chip chip-btn ${tags.includes(t) ? 'sel' : ''}`}
              onClick={() => setTags(x => x.includes(t) ? x.filter(y => y !== t) : [...x, t])}>{t}</button>)}
          </div>
          <textarea className="input" rows="2" placeholder="Nota opcional…" value={note} onChange={e => setNote(e.target.value)} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn primary" disabled={!sel} onClick={() => {
              dispatch({ type: 'day', patch: { mood: sel, moodTags: tags, note } })
              dispatch({ type: 'addXp', xp: 8 })
              const m = state.missions.find(m => m.id === 'm2')
              if (m && !m.done) dispatch({ type: 'completeMission', id: 'm2' })
              toast('Ánimo registrado', 8)
            }}>Guardar</button>
            <button className="btn ghost sm" onClick={() => setDetail(true)}>Registro detallado</button>
          </div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Calendario emocional — 4 semanas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {days28.map(({ k, d }) => (
              <div key={k} title={k} style={{
                aspectRatio: '1', borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: 13,
                background: d?.mood ? `color-mix(in srgb, var(--accent) ${d.mood * 16}%, var(--surface2))` : 'var(--surface2)',
              }}>{d?.mood ? MOODS[d.mood - 1] : ''}</div>
            ))}
          </div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Qué mejora tu ánimo</div>
          <div className="stack" style={{ gap: 7 }}>
            {tagBoost.slice(0, 5).map(x => <div key={x.t} className="row between small">
              <span className="chip">{x.t}</span>
              <div className="row" style={{ gap: 6 }}>
                <div className="pbar thin" style={{ width: 90 }}><div style={{ width: `${x.avg * 20}%`, background: x.avg >= 3.5 ? 'var(--ok)' : 'var(--warn)' }} /></div>
                <span className="mono xs faint">{x.avg.toFixed(1)}</span>
              </div>
            </div>)}
          </div>
          <div className="xs muted" style={{ marginTop: 10 }}>Los días marcados como «enfocado» y «social» son tus mejores días. Los «estresado» suelen coincidir con dormir menos de 6,5 h.</div>
        </div>
        <div className="card anim-in" style={{ gridColumn: 'span 3' }}>
          <div className="card-title">Tendencia — 28 días</div>
          <Sparkline data={days28.map(({ d }) => d?.mood || 3)} width={720} height={60} fill />
        </div>
      </div>
      {detail && <Modal onClose={() => setDetail(false)}>
        <h2 style={{ marginBottom: 14 }}>Registro detallado</h2>
        {[['Emoción principal', 'Calma, alegría, frustración…'], ['Causa', '¿Qué lo ha provocado?'], ['Personas', '¿Con quién estabas?'], ['Lugar', 'Casa, oficina, calle…'], ['Pensamientos', 'Qué pasaba por tu cabeza']].map(([l, p]) => (
          <div className="field" key={l}><label className="lbl">{l}</label><input className="input" placeholder={p} /></div>
        ))}
        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { dispatch({ type: 'addXp', xp: 15 }); toast('Registro detallado guardado', 15); setDetail(false) }}>Guardar · +15 XP</button>
      </Modal>}
    </div>
  )
}

// ============ FINANZAS ============
export function Finance() {
  const { state, dispatch, toast } = useStore()
  const [showNew, setShowNew] = useState(false)
  const [f, setF] = useState({ amount: '', cat: 'Comida', label: '', impulsive: false })
  const monthDays = [...Array(30)].map((_, i) => state.days[dayKey(-i)]).filter(Boolean)
  const monthSpend = monthDays.reduce((a, d) => a + d.expenses.reduce((x, e) => x + e.amount, 0), 0)
  const byCat = {}
  monthDays.forEach(d => d.expenses.forEach(e => byCat[e.cat] = (byCat[e.cat] || 0) + e.amount))
  const impulsive = monthDays.reduce((a, d) => a + d.expenses.filter(e => e.impulsive).reduce((x, e) => x + e.amount, 0), 0)
  const noSpendDays = monthDays.filter(d => !d.expenses.length).length
  const stressSpend = monthDays.filter(d => d.stress >= 7).reduce((a, d) => a + d.expenses.reduce((x, e) => x + e.amount, 0), 0)
  const stressDays = monthDays.filter(d => d.stress >= 7).length
  const g = state.goals.find(g => g.type === 'financiero')

  return (
    <div>
      <div className="page-head">
        <div><h1>Finanzas personales</h1><div className="subtitle">Tu dinero, en contexto con tu vida.</div></div>
        <button className="btn primary" onClick={() => setShowNew(true)}>+ Registrar gasto</button>
      </div>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card anim-in"><div className="card-title">Gasto del mes</div><div className="big-num"><Num value={monthSpend} decimals={0} /> €</div></div>
        <div className="card anim-in"><div className="card-title">Compras impulsivas</div><div className="big-num" style={{ color: 'var(--warn)' }}><Num value={impulsive} decimals={0} /> €</div><div className="xs faint">{Math.round(impulsive / monthSpend * 100) || 0}% del total</div></div>
        <div className="card anim-in"><div className="card-title">Días sin gastar</div><div className="big-num"><Num value={noSpendDays} /></div><div className="xs faint">+5 monedas por día</div></div>
        <div className="card anim-in"><div className="card-title">Ahorro (viaje)</div><div className="big-num">{g ? Math.round((g.current / g.target) * 100) : 0}%</div><div className="xs faint mono">{g?.current} / {g?.target} €</div></div>
      </div>
      <div className="grid g3">
        <div className="card anim-in">
          <div className="card-title">Presupuestos</div>
          <div className="stack">
            {Object.entries(state.budgets).map(([cat, b]) => {
              const spent = byCat[cat] || 0
              const pct = Math.round((spent / b) * 100)
              return <div key={cat}>
                <div className="row between small"><span style={{ fontWeight: 550 }}>{cat}</span><span className="mono xs faint">{spent.toFixed(0)} / {b} €</span></div>
                <div className="pbar thin" style={{ marginTop: 3 }}><div style={{ width: `${Math.min(100, pct)}%`, background: pct > 100 ? 'var(--bad)' : pct > 80 ? 'var(--warn)' : 'var(--ok)' }} /></div>
              </div>
            })}
          </div>
          <div className="xs muted" style={{ marginTop: 10 }}>Respetar todos los presupuestos este mes: <b>+80 XP</b></div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Por categoría</div>
          <div className="row" style={{ gap: 14 }}>
            <Donut size={110} data={Object.entries(byCat).slice(0, 5).map(([c, v], i) => ({ label: c, value: v, color: `var(--chart${(i % 4) + 1})` }))} />
            <div className="stack" style={{ gap: 4 }}>
              {Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, v], i) => (
                <div key={c} className="row xs" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 2, background: `var(--chart${(i % 4) + 1})` }} /><span>{c}</span><span className="faint mono">{v.toFixed(0)} €</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="card anim-in">
          <div className="card-title">Dinero × vida</div>
          <div className="stack small" style={{ gap: 8 }}>
            <div>💭 En días de estrés alto gastas de media <b>{stressDays ? (stressSpend / stressDays).toFixed(0) : 0} €</b> frente a <b>{((monthSpend - stressSpend) / Math.max(1, monthDays.length - stressDays)).toFixed(0)} €</b> los demás días.</div>
            <div className="xs muted">→ Antes de una compra no planificada, espera 24 h. Registrarla como «impulsiva» ya reduce su frecuencia.</div>
          </div>
        </div>
        <div className="card anim-in" style={{ gridColumn: 'span 3' }}>
          <div className="card-title">Últimos movimientos</div>
          <table className="tbl"><thead><tr><th>Concepto</th><th>Categoría</th><th>Importe</th><th></th></tr></thead>
            <tbody>{monthDays.slice(0, 8).flatMap((d, i) => d.expenses.map((e, j) => (
              <tr key={`${i}-${j}`}><td style={{ fontWeight: 550 }}>{e.label}</td><td className="muted">{e.cat}</td><td className="mono">{e.amount.toFixed(2)} €</td><td>{e.impulsive && <span className="chip warn">impulsiva</span>}</td></tr>
            )))}</tbody></table>
        </div>
      </div>
      {showNew && <Modal onClose={() => setShowNew(false)}>
        <h2 style={{ marginBottom: 14 }}>Registrar gasto</h2>
        <div className="grid g2">
          <div className="field"><label className="lbl">Importe (€)</label><input autoFocus className="input" type="number" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></div>
          <div className="field"><label className="lbl">Categoría</label><select className="input" value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>{['Comida', 'Ocio', 'Transporte', 'Suscripciones', 'Hogar', 'Compras', 'Salud'].map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="field"><label className="lbl">Concepto</label><input className="input" value={f.label} onChange={e => setF({ ...f, label: e.target.value })} /></div>
        <label className="row small" style={{ marginBottom: 14, cursor: 'pointer' }}><input type="checkbox" checked={f.impulsive} onChange={e => setF({ ...f, impulsive: e.target.checked })} /> Compra impulsiva (sé honesto, sin culpa)</label>
        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!f.amount} onClick={() => {
          dispatch({ type: 'addExpense', expense: { amount: +f.amount, cat: f.cat, label: f.label || f.cat, impulsive: f.impulsive } })
          toast('Gasto registrado'); setShowNew(false)
        }}>Guardar</button>
      </Modal>}
    </div>
  )
}

// ============ DIARIO ============
export function Journal() {
  const { state, dispatch, toast } = useStore()
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const [entry, setEntry] = useState({ template: 'Reflexión diaria', title: '', body: '', tags: '' })
  const [zen, setZen] = useState(false)
  const TEMPLATES = ['Reflexión diaria', 'Gratitud', 'Revisión semanal', 'Brain dump', 'Lecciones aprendidas', 'Decisiones', 'Diario libre']
  const PROMPTS = {
    'Reflexión diaria': '¿Qué ha definido el día de hoy? ¿Qué repetirías mañana?',
    'Gratitud': 'Tres cosas concretas de hoy por las que sientes gratitud.',
    'Revisión semanal': '¿Cuál fue tu mayor victoria? ¿Qué ajustarías la próxima semana?',
    'Brain dump': 'Vacía la cabeza. Sin orden, sin juicio.',
    'Lecciones aprendidas': '¿Qué aprendiste y cómo lo aplicarás?',
    'Decisiones': '¿Qué decisión tomaste y qué opciones descartaste?',
    'Diario libre': 'Escribe lo que necesites.',
  }
  const list = state.journal.filter(j =>
    (filter === 'todas' || (filter === 'favoritas' ? j.fav : j.template === filter)) &&
    (!search || (j.title + j.body).toLowerCase().includes(search.toLowerCase())))

  return (
    <div>
      <div className="page-head">
        <div><h1>Diario</h1><div className="subtitle">{state.journal.length} entradas · constancia: {Math.min(100, state.journal.length * 8)}%</div></div>
        <button className="btn primary" onClick={() => setShowNew(true)}>+ Escribir</button>
      </div>
      <div className="row wrap" style={{ marginBottom: 14 }}>
        <input className="input" style={{ maxWidth: 240 }} placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
        {['todas', 'favoritas', ...TEMPLATES.slice(0, 4)].map(t => <button key={t} className={`chip chip-btn ${filter === t ? 'sel' : ''}`} onClick={() => setFilter(t)}>{t}</button>)}
      </div>
      <div className="stack">
        {list.map(j => (
          <div key={j.id} className="card anim-in">
            <div className="row between">
              <div className="row"><span className="chip accent">{j.template}</span><b className="small">{j.title}</b></div>
              <div className="row">
                <span className="xs faint">{j.date}</span>
                {j.mood > 0 && <span aria-label={`ánimo ${j.mood}`}>{MOODS[j.mood - 1]}</span>}
                <button className="btn ghost sm" aria-label="Favorito" onClick={() => dispatch({ type: 'journalFav', id: j.id })}>{j.fav ? '★' : '☆'}</button>
              </div>
            </div>
            <p className="small muted" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{j.body}</p>
            <div className="row" style={{ marginTop: 8 }}>{j.tags.map(t => <span key={t} className="chip">#{t}</span>)}</div>
          </div>
        ))}
        {!list.length && <Empty icon="✎" title="Nada por aquí todavía" text="El diario convierte los días en aprendizaje. Una línea basta: «Hoy lo mejor fue…»" cta="Escribir la primera entrada" onCta={() => setShowNew(true)} />}
      </div>
      {showNew && <Modal onClose={() => setShowNew(false)} wide>
        {!zen && <><h2 style={{ marginBottom: 12 }}>Nueva entrada</h2>
          <div className="row wrap" style={{ marginBottom: 12 }}>
            {TEMPLATES.map(t => <button key={t} className={`chip chip-btn ${entry.template === t ? 'sel' : ''}`} onClick={() => setEntry({ ...entry, template: t })}>{t}</button>)}
          </div>
          <div className="xs muted" style={{ marginBottom: 10 }}>💭 {PROMPTS[entry.template]}</div>
          <div className="field"><input className="input" placeholder="Título" value={entry.title} onChange={e => setEntry({ ...entry, title: e.target.value })} /></div></>}
        <textarea className="input" rows={zen ? 16 : 7} placeholder="Escribe con Markdown básico…" value={entry.body} onChange={e => setEntry({ ...entry, body: e.target.value })} autoFocus />
        <div className="row between" style={{ marginTop: 10 }}>
          <button className="btn ghost sm" onClick={() => setZen(!zen)}>{zen ? 'Vista normal' : 'Sin distracciones'}</button>
          <div className="row">
            <input className="input" style={{ width: 150 }} placeholder="etiquetas, coma" value={entry.tags} onChange={e => setEntry({ ...entry, tags: e.target.value })} />
            <button className="btn primary" disabled={!entry.body} onClick={() => {
              dispatch({ type: 'addJournal', entry: { date: todayKey(), template: entry.template, title: entry.title || entry.template, body: entry.body, tags: entry.tags.split(',').map(t => t.trim()).filter(Boolean), mood: state.days[todayKey()].mood, fav: false } })
              dispatch({ type: 'addXp', xp: 12 }); toast('Entrada guardada', 12); setShowNew(false)
            }}>Guardar · +12 XP</button>
          </div>
        </div>
      </Modal>}
    </div>
  )
}
