// ===== LifeOS data engine: demo data + game logic =====

export const AREAS = [
  { id: 'salud', name: 'Salud', color: 'var(--chart2)' },
  { id: 'trabajo', name: 'Trabajo', color: 'var(--chart1)' },
  { id: 'aprendizaje', name: 'Aprendizaje', color: 'var(--chart4)' },
  { id: 'finanzas', name: 'Finanzas', color: 'var(--chart3)' },
  { id: 'relaciones', name: 'Relaciones', color: 'var(--warn)' },
  { id: 'descanso', name: 'Descanso', color: 'var(--ok)' },
  { id: 'crecimiento', name: 'Crecimiento', color: 'var(--accent)' },
  { id: 'creatividad', name: 'Creatividad', color: 'var(--bad)' },
]

export const THEMES = [
  { id: 'porcelain', name: 'Porcelain', desc: 'Claro cálido, acento azul grisáceo' },
  { id: 'obsidian', name: 'Obsidian', desc: 'Oscuro profundo, grafito y plata' },
  { id: 'midnight', name: 'Midnight', desc: 'Azul noche con cyan sutil' },
  { id: 'forest', name: 'Forest', desc: 'Verdes oscuros, musgo y salvia' },
  { id: 'solar', name: 'Solar', desc: 'Beige, marrón y ámbar' },
  { id: 'monochrome', name: 'Monochrome', desc: 'Blanco, negro y grises' },
  { id: 'oled', name: 'OLED', desc: 'Negro puro con acentos neón' },
]

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10)
export function dayKey(offset) {
  const d = new Date(); d.setDate(d.getDate() + offset); return todayKey(d)
}
export const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// XP curve: level n requires 100 * n^1.35
export function levelFromXp(xp) {
  let lvl = 1, need = 100, acc = 0
  while (xp >= acc + need) { acc += need; lvl++; need = Math.round(100 * Math.pow(lvl, 1.35)) }
  return { lvl, into: xp - acc, need, pct: Math.round(((xp - acc) / need) * 100) }
}

// Catálogo de hábitos sugeridos para el onboarding — plantillas, no datos del usuario.
export const HABIT_DEFS = [
  { id: 'leer', name: 'Leer 20 minutos', icon: '📖', area: 'aprendizaje', type: 'duración', target: 20, unit: 'min', xp: 15, difficulty: 2, time: '21:30', freq: 'diario' },
  { id: 'entrenar', name: 'Entrenar', icon: '💪', area: 'salud', type: 'sí/no', target: 1, unit: '', xp: 25, difficulty: 3, time: '18:00', freq: 'L,X,V' },
  { id: 'agua', name: 'Beber 2 L de agua', icon: '💧', area: 'salud', type: 'cantidad', target: 2, unit: 'L', xp: 10, difficulty: 1, time: '', freq: 'diario' },
  { id: 'dormir', name: 'Dormir 8 horas', icon: '🌙', area: 'descanso', type: 'duración', target: 8, unit: 'h', xp: 20, difficulty: 2, time: '23:30', freq: 'diario' },
  { id: 'pasos', name: 'Caminar 8.000 pasos', icon: '👟', area: 'salud', type: 'cantidad', target: 8000, unit: 'pasos', xp: 15, difficulty: 2, time: '', freq: 'diario' },
  { id: 'estudiar', name: 'Estudiar 1 hora', icon: '🎓', area: 'aprendizaje', type: 'duración', target: 60, unit: 'min', xp: 20, difficulty: 3, time: '10:00', freq: 'L-V' },
  { id: 'meditar', name: 'Meditar', icon: '🧘', area: 'crecimiento', type: 'duración', target: 10, unit: 'min', xp: 12, difficulty: 2, time: '08:00', freq: 'diario' },
  { id: 'diario', name: 'Escribir en el diario', icon: '✍️', area: 'crecimiento', type: 'sí/no', target: 1, unit: '', xp: 10, difficulty: 1, time: '22:30', freq: 'diario' },
  { id: 'nogasto', name: 'No gastar impulsivamente', icon: '🚫', area: 'finanzas', type: 'negativo', target: 1, unit: '', xp: 15, difficulty: 2, time: '', freq: 'diario' },
]

// Estado inicial real: un usuario nuevo empieza sin datos, sin historial y sin logros
// falsos. Todo lo que aparece después (hábitos, objetivos, XP, racha) es fruto de su
// propio uso — el onboarding solo ayuda a configurar la estructura inicial.
export function generateEmptyData({ name } = {}) {
  return {
    onboarded: false,
    profile: { name: name || 'Tú', title: 'Recién llegado', joined: todayKey() },
    theme: 'porcelain',
    xp: 0, coins: 0,
    areaXp: {},
    attributes: { Disciplina: 0, Constancia: 0, Enfoque: 0, Energía: 0, Conocimiento: 0, Equilibrio: 0, Autocuidado: 0, Organización: 0, Resiliencia: 0 },
    habits: [],
    days: {},
    journal: [],
    goals: [],
    missions: [],
    rewards: [
      { id: 'r1', name: 'Ver una película', cost: 40, icon: '🎬' },
      { id: 'r2', name: 'Comprar un libro', cost: 80, icon: '📚' },
      { id: 'r3', name: 'Jugar dos horas', cost: 60, icon: '🎮' },
      { id: 'r4', name: 'Salir a cenar', cost: 150, icon: '🍜' },
      { id: 'r5', name: 'Tarde libre', cost: 250, icon: '🏖️' },
    ],
    unlockedAchievements: [],
    streakSavers: 1,
    mvd: [],
    budgets: {},
    dashboardWidgets: ['resumen', 'nivel', 'racha', 'habitos', 'objetivos', 'animo', 'sueño', 'enfoque', 'finanzas', 'areas', 'actividad', 'insight'],
    weeklyReviews: [],
  }
}

// ---- Achievements (100) ----
const RARITIES = ['común', 'poco común', 'raro', 'épico', 'legendario']
function ach(id, name, desc, cat, rarity, pct, icon) { return { id, name, desc, cat, rarity, pct, icon } }
export const ACHIEVEMENTS = [
  ach('a1', 'Primer paso', 'Completa tu primer hábito', 'Consistencia', 'común', 96, '◆'),
  ach('a2', 'Tres seguidos', 'Racha de 3 días', 'Consistencia', 'común', 78, '◆'),
  ach('a3', 'Siete días seguidos', 'Una semana de racha global', 'Consistencia', 'poco común', 44, '❖'),
  ach('a4', 'Un mes de constancia', '30 días de racha', 'Consistencia', 'raro', 12, '✦'),
  ach('a5', 'Trimestre sólido', '90 días de racha', 'Consistencia', 'épico', 3, '✧'),
  ach('a6', 'Sin días vacíos', '30 días con al menos un registro', 'Consistencia', 'raro', 15, '✦'),
  ach('a7', 'Año imparable', '365 días activos', 'Consistencia', 'legendario', 0.4, '★'),
  ach('a8', 'Recuperación', 'Vuelve tras 5+ días de pausa', 'Consistencia', 'poco común', 38, '❖'),
  ach('a9', 'Semana perfecta', '100% de hábitos en 7 días', 'Consistencia', 'épico', 5, '✧'),
  ach('a10', 'Constante', '70% de cumplimiento mensual', 'Consistencia', 'poco común', 31, '❖'),
  ach('a11', 'Ritual matinal', 'Completa 3 hábitos antes de las 9:00, 10 veces', 'Hábitos', 'raro', 18, '✦'),
  ach('a12', 'Coleccionista', 'Crea 10 hábitos', 'Hábitos', 'común', 55, '◆'),
  ach('a13', 'Curador', 'Archiva un hábito que ya dominas', 'Hábitos', 'poco común', 25, '❖'),
  ach('a14', 'Cien repeticiones', '100 completados de un mismo hábito', 'Hábitos', 'raro', 14, '✦'),
  ach('a15', 'Quinientas', '500 completados totales', 'Hábitos', 'épico', 6, '✧'),
  ach('a16', 'Dominio', 'Un hábito al 90% durante 3 meses', 'Hábitos', 'legendario', 1.2, '★'),
  ach('a17', 'Resistencia', 'Mantén un hábito negativo 21 días', 'Hábitos', 'raro', 11, '✦'),
  ach('a18', 'Equilibrista', 'Hábitos activos en 5 áreas', 'Hábitos', 'poco común', 29, '❖'),
  ach('a19', 'Minimalista', 'Completa tu Minimum Viable Day 10 veces', 'Hábitos', 'poco común', 22, '❖'),
  ach('a20', 'Primera sesión', 'Completa una sesión de enfoque', 'Enfoque', 'común', 82, '◆'),
  ach('a21', 'Pomodoro x25', '25 pomodoros completados', 'Enfoque', 'poco común', 35, '❖'),
  ach('a22', 'Cien sesiones de enfoque', '100 sesiones terminadas', 'Enfoque', 'raro', 9, '✦'),
  ach('a23', 'Inmersión', 'Sesión de 90 minutos sin interrupciones', 'Enfoque', 'raro', 16, '✦'),
  ach('a24', 'Integridad total', 'Focus Integrity 100 en una sesión', 'Enfoque', 'épico', 7, '✧'),
  ach('a25', 'Mil horas registradas', '1.000 h de tiempo registrado', 'Enfoque', 'legendario', 0.8, '★'),
  ach('a26', 'Dominio del tiempo', 'Planifica y cumple 5 días seguidos', 'Enfoque', 'épico', 4, '✧'),
  ach('a30', 'Madrugador', 'Levántate antes de las 7:00, 5 días', 'Sueño', 'poco común', 27, '❖'),
  ach('a31', 'Noctámbulo reformado', 'Acuéstate antes de las 23:30, 7 días', 'Sueño', 'raro', 13, '✦'),
  ach('a32', 'Ocho completas', '8 h de sueño, 7 noches seguidas', 'Sueño', 'raro', 10, '✦'),
  ach('a33', 'Ritmo circadiano', 'Horario estable ±30 min, 14 días', 'Sueño', 'épico', 3.5, '✧'),
  ach('a40', 'En marcha', '10.000 pasos en un día', 'Salud', 'común', 68, '◆'),
  ach('a41', 'Maratón mensual', '250.000 pasos en un mes', 'Salud', 'raro', 12, '✦'),
  ach('a42', 'Hidratado', '2 L de agua, 14 días seguidos', 'Salud', 'poco común', 24, '❖'),
  ach('a43', 'Atleta constante', '12 entrenamientos en un mes', 'Salud', 'raro', 15, '✦'),
  ach('a44', 'Energía plena', 'Energía media 8+, una semana', 'Salud', 'épico', 5, '✧'),
  ach('a50', 'Estudiante', '10 h de estudio en una semana', 'Aprendizaje', 'poco común', 26, '❖'),
  ach('a51', 'Ratón de biblioteca', 'Lee 30 días seguidos', 'Aprendizaje', 'raro', 9, '✦'),
  ach('a52', 'Curioso', 'Completa un objetivo de aprendizaje', 'Aprendizaje', 'poco común', 33, '❖'),
  ach('a53', 'Erudito', '100 h de aprendizaje registradas', 'Aprendizaje', 'épico', 6, '✧'),
  ach('a60', 'Primer presupuesto', 'Crea un presupuesto', 'Finanzas', 'común', 61, '◆'),
  ach('a61', 'Semana austera', '7 días sin gastos impulsivos', 'Finanzas', 'raro', 14, '✦'),
  ach('a62', 'Ahorrador', 'Alcanza un objetivo de ahorro', 'Finanzas', 'épico', 8, '✧'),
  ach('a63', 'Bajo control', 'Respeta todos los presupuestos un mes', 'Finanzas', 'raro', 11, '✦'),
  ach('a64', 'Día sin gastar', '10 días sin ningún gasto', 'Finanzas', 'poco común', 30, '❖'),
  ach('a70', 'Primera página', 'Escribe tu primera entrada', 'Diario', 'común', 74, '◆'),
  ach('a71', 'Escritor semanal', '7 entradas en una semana', 'Diario', 'raro', 10, '✦'),
  ach('a72', 'Gratitud', '10 entradas de gratitud', 'Diario', 'poco común', 28, '❖'),
  ach('a73', 'Cronista', '100 entradas totales', 'Diario', 'épico', 4, '✧'),
  ach('a80', 'Primer objetivo', 'Crea tu primer objetivo', 'Objetivos', 'común', 88, '◆'),
  ach('a81', 'Cazador de objetivos', 'Completa 5 objetivos', 'Objetivos', 'raro', 13, '✦'),
  ach('a82', 'Visionario', 'Completa un objetivo a largo plazo', 'Objetivos', 'épico', 6, '✧'),
  ach('a83', 'Adelantado', 'Termina un objetivo antes de fecha', 'Objetivos', 'raro', 12, '✦'),
  ach('a90', 'Equilibrio total', 'Todas las áreas por encima de 60', 'Equilibrio', 'legendario', 1.5, '★'),
  ach('a91', 'Semana equilibrada', 'Tiempo en 5+ áreas en una semana', 'Equilibrio', 'raro', 16, '✦'),
  ach('a92', 'Renacimiento', 'Recupera un área por debajo de 30', 'Equilibrio', 'épico', 7, '✧'),
  ach('a95', 'Explorador', 'Visita todas las secciones', 'Exploración', 'común', 52, '◆'),
  ach('a96', 'Personalizador', 'Cambia de tema 3 veces', 'Exploración', 'común', 47, '◆'),
  ach('a97', 'Arquitecto', 'Crea un dashboard personalizado', 'Exploración', 'poco común', 32, '❖'),
  ach('a98', '???', 'Cierra el día antes de las 21:00', 'Secretos', 'secreto', 2, '?'),
  ach('a99', '???', 'Un día perfecto: hábitos, enfoque, ánimo y sueño', 'Secretos', 'secreto', 0.9, '?'),
  ach('a100', '???', 'Escribe en el diario a medianoche exacta', 'Secretos', 'secreto', 0.3, '?'),
]
// pad to 100 with generated tier achievements
const CAT_TIERS = [['Consistencia','racha'],['Hábitos','hábitos completados'],['Enfoque','horas de enfoque'],['Sueño','noches óptimas'],['Salud','días activos'],['Aprendizaje','horas de estudio'],['Finanzas','días bajo presupuesto'],['Diario','entradas'],['Objetivos','hitos'],['Equilibrio','semanas equilibradas']]
let n = 0
while (ACHIEVEMENTS.length < 100) {
  const [cat, metric] = CAT_TIERS[n % CAT_TIERS.length]
  const tier = Math.floor(n / CAT_TIERS.length) + 2
  ACHIEVEMENTS.push(ach(`ax${n}`, `${cat} ${['II','III','IV','V'][tier-2] || tier}`, `Alcanza ${tier * 25} ${metric}`, cat, RARITIES[Math.min(4, tier - 1)], Math.max(0.5, 40 / tier ** 2), ['◆','❖','✦','✧','★'][Math.min(4, tier - 1)]))
  n++
}

// ---- Derived metrics ----
export function dayCompletion(day, habits) {
  if (!day) return 0
  const t = habits.length
  const done = habits.filter(h => day.habits?.[h.id]?.done).length
  return t ? Math.round((done / t) * 100) : 0
}

export function globalStreak(state) {
  let s = 0
  for (let i = 0; i < 60; i++) {
    const d = state.days[dayKey(-i)]
    if (d && Object.values(d.habits || {}).some(h => h.done)) s++
    else if (i === 0) continue // today may be in progress
    else break
  }
  return s
}

export function habitStats(state, hid) {
  const keys = Object.keys(state.days).sort()
  let streak = 0, best = 0, cur = 0, done = 0, total = 0
  const byDow = [0, 0, 0, 0, 0, 0, 0]
  for (const k of keys) {
    const d = state.days[k].habits?.[hid]
    total++
    if (d?.done) { done++; cur++; best = Math.max(best, cur); byDow[new Date(k + 'T12:00').getDay()]++ }
    else cur = 0
  }
  // streak counted backwards from today (today pending doesn't break it)
  for (let i = 0; i < 60; i++) {
    const d = state.days[dayKey(-i)]?.habits?.[hid]
    if (d?.done) streak++
    else if (i === 0) continue
    else break
  }
  const bestDow = byDow.indexOf(Math.max(...byDow))
  return { streak, best, rate: total ? Math.round((done / total) * 100) : 0, done, total, bestDow, byDow }
}

export function lifeScore(state) {
  const last7 = [...Array(7)].map((_, i) => state.days[dayKey(-i)]).filter(Boolean)
  const consist = last7.reduce((a, d) => a + dayCompletion(d, state.habits), 0) / Math.max(1, last7.length)
  const sleep = Math.min(100, (last7.reduce((a, d) => a + d.sleepH, 0) / Math.max(1, last7.length) / 8) * 100)
  const moodAvg = (last7.reduce((a, d) => a + d.mood, 0) / Math.max(1, last7.length) / 5) * 100
  const energyAvg = (last7.reduce((a, d) => a + d.energy, 0) / Math.max(1, last7.length) / 10) * 100
  const focus = Math.min(100, last7.reduce((a, d) => a + d.focusSessions.reduce((x, s) => x + s.minutes, 0), 0) / 8)
  const goalP = state.goals.length ? state.goals.reduce((a, g) => a + ((g.current - g.start) / (g.target - g.start)) * 100, 0) / state.goals.length : 50
  const areaVals = Object.values(areaScores(state))
  const balance = 100 - (Math.max(...areaVals) - Math.min(...areaVals))
  const factors = [
    { name: 'Consistencia', v: Math.round(consist), w: 0.22 },
    { name: 'Sueño', v: Math.round(sleep), w: 0.15 },
    { name: 'Estado emocional', v: Math.round(moodAvg), w: 0.13 },
    { name: 'Energía', v: Math.round(energyAvg), w: 0.12 },
    { name: 'Enfoque', v: Math.round(focus), w: 0.15 },
    { name: 'Objetivos', v: Math.round(goalP), w: 0.13 },
    { name: 'Equilibrio', v: Math.round(Math.max(0, balance)), w: 0.10 },
  ]
  const score = Math.round(factors.reduce((a, f) => a + f.v * f.w, 0))
  return { score, factors }
}

export function areaScores(state) {
  const out = {}
  for (const a of AREAS) {
    const ah = state.habits.filter(h => h.area === a.id)
    let v = 40
    if (ah.length) {
      const last14 = [...Array(14)].map((_, i) => state.days[dayKey(-i)]).filter(Boolean)
      const rate = last14.reduce((acc, d) => acc + ah.filter(h => d.habits?.[h.id]?.done).length, 0) / Math.max(1, last14.length * ah.length)
      v = Math.round(30 + rate * 65)
    } else v = 25 + Math.round((state.areaXp[a.id] || 0) / 40)
    out[a.id] = Math.min(100, v)
  }
  return out
}

export function momentum(state) {
  const w = (off) => [...Array(7)].map((_, i) => state.days[dayKey(-i - off)]).filter(Boolean)
  const avg = (ds) => ds.reduce((a, d) => a + dayCompletion(d, state.habits), 0) / Math.max(1, ds.length)
  const cur = avg(w(0)), prev = avg(w(7))
  const delta = Math.round(cur - prev)
  return { value: Math.round(50 + delta * 1.5), delta, label: delta > 8 ? 'Impulso fuerte' : delta > 0 ? 'Dinámica positiva' : delta > -8 ? 'Estable' : 'Perdiendo ritmo' }
}

export function dayArchetype(day, habits) {
  if (!day) return '—'
  const focus = day.focusSessions.reduce((a, s) => a + s.minutes, 0)
  const comp = dayCompletion(day, habits)
  if (focus > 150) return 'Día de progreso profundo'
  if (focus > 90) return 'Día de alta concentración'
  if (day.energy <= 3) return 'Día de baja energía'
  if (comp >= 80 && day.mood >= 4) return 'Día equilibrado'
  if (day.moodTags?.includes('social')) return 'Día social'
  if (comp < 30) return 'Día de recuperación'
  if (day.focusSessions.length >= 3 && focus < 90) return 'Día fragmentado'
  return 'Día equilibrado'
}

export function computeInsights(state) {
  const days = [...Array(28)].map((_, i) => ({ k: dayKey(-i), d: state.days[dayKey(-i)] })).filter(x => x.d)
  const ins = []
  const goodSleep = days.filter(x => x.d.sleepH >= 7), badSleep = days.filter(x => x.d.sleepH < 7)
  if (goodSleep.length > 3 && badSleep.length > 3) {
    const a = goodSleep.reduce((s, x) => s + dayCompletion(x.d, state.habits), 0) / goodSleep.length
    const b = badSleep.reduce((s, x) => s + dayCompletion(x.d, state.habits), 0) / badSleep.length
    if (a - b > 5) ins.push({ icon: '🌙', text: `Los días que duermes más de 7 horas completas un ${Math.round(a - b)} % más de hábitos.`, action: 'Adelanta tu hora de acostarte 20 minutos esta semana.' })
  }
  const byDow = [0, 1, 2, 3, 4, 5, 6].map(dw => {
    const ds = days.filter(x => new Date(x.k + 'T12:00').getDay() === dw)
    return { dw, e: ds.reduce((s, x) => s + x.d.energy, 0) / Math.max(1, ds.length) }
  })
  const worst = byDow.reduce((a, b) => (b.e < a.e ? b : a))
  ins.push({ icon: '⚡', text: `Tu energía suele caer los ${DOW[worst.dw].toLowerCase()}${worst.dw === 2 ? 'rcoles' : ''} (media ${worst.e.toFixed(1)}/10).`, action: 'Programa ese día tareas ligeras y una pausa activa a media tarde.' })
  const walk = days.filter(x => x.d.steps > 6000), noWalk = days.filter(x => x.d.steps <= 6000)
  if (walk.length > 3 && noWalk.length > 3) {
    const dm = walk.reduce((s, x) => s + x.d.mood, 0) / walk.length - noWalk.reduce((s, x) => s + x.d.mood, 0) / noWalk.length
    if (dm > 0.2) ins.push({ icon: '👟', text: `Tu estado de ánimo mejora ${(dm * 20).toFixed(0)} % los días que caminas más de 6.000 pasos.`, action: 'Añade un paseo corto después de comer.' })
  }
  const m = momentum(state)
  if (m.delta > 0) ins.push({ icon: '📈', text: `Tu constancia ha aumentado un ${m.delta} % respecto a la semana pasada.`, action: 'Mantén el mismo horario: está funcionando.' })
  else if (m.delta < -5) ins.push({ icon: '🪫', text: `Tu constancia ha bajado un ${-m.delta} % esta semana.`, action: 'Activa el Minimum Viable Day para no perder el hilo.' })
  const ocio = days.reduce((s, x) => s + x.d.expenses.filter(e => e.cat === 'Ocio').reduce((a, e) => a + e.amount, 0), 0)
  if (ocio > (state.budgets.Ocio || 120)) ins.push({ icon: '💶', text: `Llevas ${Math.round(ocio - state.budgets.Ocio)} € por encima de tu presupuesto de ocio este mes.`, action: 'Planifica un fin de semana de bajo coste.' })
  const g1 = state.goals[0]
  if (g1) {
    const daysLeft = Math.round((new Date(g1.deadline) - new Date()) / 86400000)
    const remaining = g1.target - g1.current
    const paceNeeded = remaining / Math.max(1, daysLeft / 7)
    const recentPace = g1.weeklyPace.slice(-2).reduce((a, b) => a + b, 0) / 2
    if (recentPace < paceNeeded) ins.push({ icon: '🎯', text: `«${g1.name}» podría retrasarse ~${Math.ceil((remaining / Math.max(0.1, recentPace) - daysLeft / 7) * 7)} días al ritmo actual.`, action: `Necesitas ${paceNeeded.toFixed(1)} ${g1.metric}/semana; ahora llevas ${recentPace.toFixed(1)}.` })
  }
  const fricCount = {}
  days.forEach(x => x.d.frictions.forEach(f => (fricCount[f] = (fricCount[f] || 0) + 1)))
  const topF = Object.entries(fricCount).sort((a, b) => b[1] - a[1])[0]
  if (topF) ins.push({ icon: '🧱', text: `Tu fricción más frecuente este mes es «${topF[0]}» (${topF[1]} veces).`, action: 'Dedica 10 minutos a diseñar una contramedida concreta.' })
  return ins
}
