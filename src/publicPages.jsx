import React, { useEffect, useRef, useState } from 'react'
import { Logo } from './Logo.jsx'
import { Link, navigate } from './router.jsx'
import { Icons } from './components.jsx'
import { registerUser, loginUser, requestPasswordReset } from './auth.js'

const NAV_SECTIONS = [
  ['producto', 'Producto'], ['funciones', 'Funciones'], ['flujo', 'Cómo funciona'],
  ['gamificacion', 'Gamificación'], ['estadisticas', 'Estadísticas'], ['faq', 'Preguntas frecuentes'],
]

function scrollToId(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function PublicNav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="pub-nav">
      <Link to="/"><Logo size={26} /></Link>
      <nav className="pub-nav-links desktop">
        {NAV_SECTIONS.map(([id, label]) => (
          <button key={id} onClick={() => scrollToId(id)}>{label}</button>
        ))}
      </nav>
      <div className="pub-nav-cta">
        <button className="btn ghost sm desktop-only" onClick={() => navigate('/login')}>Iniciar sesión</button>
        <button className="btn primary sm" onClick={() => navigate('/register')}>Crear cuenta</button>
        <button className="btn ghost sm pub-burger" aria-label="Abrir menú" onClick={() => setOpen(true)}>{Icons.plus}</button>
      </div>
      {open && (
        <div className="pub-mobile-menu" role="dialog" aria-label="Menú">
          <div className="row between" style={{ marginBottom: 12 }}>
            <Logo size={24} />
            <button className="btn ghost sm" aria-label="Cerrar menú" onClick={() => setOpen(false)}>✕</button>
          </div>
          {NAV_SECTIONS.map(([id, label]) => (
            <button key={id} onClick={() => { setOpen(false); setTimeout(() => scrollToId(id), 50) }}>{label}</button>
          ))}
          <div className="divider" />
          <button onClick={() => { setOpen(false); navigate('/login') }}>Iniciar sesión</button>
          <button onClick={() => { setOpen(false); navigate('/register') }}>Crear cuenta</button>
        </div>
      )}
    </header>
  )
}

function HeroVideo({ small }) {
  const ref = useRef(null)
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const h = () => setReduced(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return (
    <div className={small ? '' : 'hero-video-wrap'} style={small ? { position: 'absolute', inset: 0 } : undefined}>
      <div className="hero-fallback" />
      {!reduced && (
        <video ref={ref} autoPlay loop muted playsInline preload="metadata" poster="/icons/icon.svg"
          onError={e => { e.currentTarget.style.display = 'none' }}>
          <source src="/video/landing-background.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  )
}

export function Landing() {
  return (
    <div className="pub">
      <PublicNav />
      <section className="hero">
        <HeroVideo />
        <div className="hero-overlay" />
        <div className="pub-kicker anim-in">SISTEMA OPERATIVO PERSONAL</div>
        <h1 className="anim-in">Tu vida, convertida en un sistema<br />que puedes entender y mejorar.</h1>
        <p className="sub anim-in">Registra hábitos, tiempo, objetivos, energía, estado de ánimo y progreso desde un único dashboard diseñado para ayudarte a avanzar cada día.</p>
        <div className="row anim-in" style={{ marginTop: 22 }}>
          <button className="btn primary" onClick={() => navigate('/register')}>Crear cuenta gratis</button>
          <button className="btn" onClick={() => navigate('/login')}>Iniciar sesión</button>
        </div>
        <div className="hero-badges anim-in">
          {['Hábitos', 'Tiempo', 'Objetivos', 'Ánimo', 'Finanzas', 'Insights', 'Gamificación'].map(t => <span key={t} className="chip">{t}</span>)}
        </div>
        <div className="hero-preview anim-in">
          <DashboardPreview />
        </div>
        <div className="hero-scroll"><span className="dot" />Descubre más</div>
      </section>

      <section id="producto" className="pub-section">
        <div className="pub-kicker">Qué es LifeOS</div>
        <h2 className="pub-h2">No es otra app de hábitos.</h2>
        <p className="pub-lead">Las apps de hábitos registran una cosa. LifeOS conecta todas las áreas de tu vida en un mismo sistema: cuando entrenas menos, ves cómo cae tu energía; cuando duermes mejor, ves cómo sube tu enfoque. Un panel, una identidad de progreso, decisiones basadas en datos reales — no en la culpa.</p>
        <div className="feature-grid">
          <div className="feature-card"><div className="ic">{Icons.spark}</div><b>Correlaciones reales</b><p className="xs muted" style={{ marginTop: 6 }}>Cada estadística se calcula sobre tus propios registros, no son cifras decorativas.</p></div>
          <div className="feature-card"><div className="ic">{Icons.trophy}</div><b>Gamificación adulta</b><p className="xs muted" style={{ marginTop: 6 }}>XP, niveles y misiones con estética premium — sin infantilizar tu progreso.</p></div>
          <div className="feature-card"><div className="ic">{Icons.habits}</div><b>Todo en un lugar</b><p className="xs muted" style={{ marginTop: 6 }}>Hábitos, tiempo, objetivos, salud, ánimo, finanzas y diario, sin cambiar de app.</p></div>
        </div>
      </section>

      <section id="funciones" className="pub-section" style={{ background: 'var(--bg2)' }}>
        <div className="pub-kicker">Dashboard unificado</div>
        <h2 className="pub-h2">Todo tu progreso, en un solo panel.</h2>
        <p className="pub-lead">Hábitos, tiempo, objetivos, sueño, energía, estado de ánimo, finanzas, diario, estadísticas y logros — centralizados y correlacionados entre sí.</p>
        <div className="feature-grid">
          {[
            ['Hábitos', 'Rachas, tasas de éxito y recuperación de racha sin culpa.'],
            ['Tiempo y enfoque', 'Pomodoro, modo enfoque y Focus Integrity real.'],
            ['Objetivos', 'Trayectos visuales con ritmo, predicción y riesgo.'],
            ['Sueño y energía', 'Correlaciones entre descanso, energía y cumplimiento.'],
            ['Estado de ánimo', 'Registro rápido o detallado con etiquetas y patrones.'],
            ['Finanzas', 'Presupuestos y su relación con el estado de ánimo.'],
          ].map(([t, d]) => (
            <div key={t} className="feature-card"><b>{t}</b><p className="xs muted" style={{ marginTop: 6 }}>{d}</p></div>
          ))}
        </div>
      </section>

      <section id="gamificacion" className="pub-section">
        <div className="pub-kicker">Gamificación adulta</div>
        <h2 className="pub-h2">Progreso que se siente serio, no infantil.</h2>
        <p className="pub-lead">XP que premia acciones con sentido, niveles globales y por área, atributos personales, misiones, combos, 100 logros por rareza y recompensas personales que cuestan monedas ganadas de verdad.</p>
        <div className="diff-grid">
          {['XP y niveles', 'Misiones y combos', 'Logros y rarezas', 'Rachas', 'Momentum', 'Recompensas personales', 'Áreas de vida', 'Atributos personales'].map(t => (
            <div key={t} className="diff-card"><b className="small">{t}</b></div>
          ))}
        </div>
      </section>

      <section id="estadisticas" className="pub-section" style={{ background: 'var(--bg2)' }}>
        <div className="pub-kicker">Estadísticas e insights</div>
        <h2 className="pub-h2">Patrones que de verdad importan.</h2>
        <p className="pub-lead">Tendencias, correlaciones, heatmaps de constancia, distribución del tiempo, Life Score, Momentum y equilibrio vital — con recomendaciones accionables, no solo gráficos bonitos.</p>
        <div className="feature-grid">
          {['Life Score', 'Momentum semanal', 'Heatmap de constancia', 'Correlación sueño↔energía', 'Distribución del tiempo', 'Equilibrio de áreas'].map(t => (
            <div key={t} className="feature-card" style={{ textAlign: 'center' }}><b className="small">{t}</b></div>
          ))}
        </div>
      </section>

      <section id="flujo" className="pub-section">
        <div className="pub-kicker">Cómo funciona</div>
        <h2 className="pub-h2">De cero a sistema personal en minutos.</h2>
        <div className="step-row">
          {[
            ['Configura tus áreas y objetivos', 'Elige qué partes de tu vida quieres medir y define tu primer objetivo.'],
            ['Registra tu actividad diaria', 'Hábitos, tiempo, ánimo, sueño y gastos en segundos, no minutos.'],
            ['Descubre patrones', 'LifeOS calcula correlaciones e insights sobre tus propios datos.'],
            ['Mejora con pequeñas acciones', 'Recomendaciones concretas y un Minimum Viable Day para los días difíciles.'],
          ].map(([t, d], i) => (
            <div key={t} className="step-card"><div className="step-num">{i + 1}</div><b className="small" style={{ display: 'block', margin: '8px 0 6px' }}>{t}</b><p className="xs muted">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="pub-section" style={{ background: 'var(--bg2)' }}>
        <div className="pub-kicker">Diferenciales</div>
        <h2 className="pub-h2">Detalles que no vas a encontrar en otra app.</h2>
        <div className="diff-grid">
          {[
            ['Minimum Viable Day', 'El mínimo que cuenta como un día válido, incluso en tus peores días.'],
            ['Recovery Mode', 'Cuando la constancia cae, LifeOS te ayuda a reconstruirla sin culpa.'],
            ['Friction Log', 'Registra qué te frenó, para detectar patrones de fricción real.'],
            ['Life Timeline', 'La historia de tu progreso, no solo el estado actual.'],
            ['Day Archetypes', 'Cada día se clasifica según su forma real, no solo su nota.'],
            ['Focus Integrity', 'Una métrica honesta de qué tan real fue tu concentración.'],
            ['Revisiones semanales', 'Una revisión guiada corta que cierra el ciclo cada semana.'],
            ['Dashboards personalizables', 'Reordena y elige qué widgets ver primero.'],
          ].map(([t, d]) => (
            <div key={t} className="diff-card"><b className="small">{t}</b><p className="xs muted" style={{ marginTop: 6 }}>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-kicker">Contenido de demostración</div>
        <h2 className="pub-h2">Lo que dicen quienes lo prueban.</h2>
        <div className="testi-grid">
          {[
            ['Llevaba meses anotando hábitos en notas sueltas. Ver todo conectado en un mismo lugar cambió cómo entiendo mis días.', 'M. — perfil de demostración'],
            ['El Recovery Mode es lo primero que no me hizo sentir mal por una mala semana.', 'A. — perfil de demostración'],
            ['Las correlaciones entre sueño y energía me hicieron cambiar mi rutina nocturna en una semana.', 'S. — perfil de demostración'],
          ].map(([q, a]) => (
            <div key={a} className="testi-card"><p className="small" style={{ lineHeight: 1.5 }}>"{q}"</p><div className="testi-badge">{a} · testimonio ilustrativo</div></div>
          ))}
        </div>
      </section>

      <section id="faq" className="pub-section" style={{ background: 'var(--bg2)' }}>
        <div className="pub-kicker">Preguntas frecuentes</div>
        <h2 className="pub-h2">Todo lo que necesitas saber.</h2>
        <FAQ />
      </section>

      <section className="cta-band">
        <h2>Empieza a entender tu progreso hoy.</h2>
        <p className="muted" style={{ margin: '10px auto 22px', maxWidth: 420 }}>Hoy cuenta, incluso si avanzas poco.</p>
        <button className="btn primary" onClick={() => navigate('/register')}>Crear cuenta gratis</button>
      </section>

      <PublicFooter />
    </div>
  )
}

function FAQ() {
  const items = [
    ['¿Mis datos son privados?', 'Sí. En esta versión, tus datos se guardan localmente en tu propio navegador y no se envían a ningún servidor externo.'],
    ['¿Puedo exportar mis datos?', 'Sí, desde Ajustes → Datos puedes exportar toda tu información en JSON o CSV cuando quieras.'],
    ['¿Puedo personalizar la app?', 'Sí: temas, densidad, widgets del dashboard, hábitos, áreas de vida y nivel de gamificación son totalmente configurables.'],
    ['¿La gamificación es obligatoria?', 'No. Puedes ajustar su intensidad (ligera, equilibrada o completa) o desactivar elementos concretos desde ajustes.'],
    ['¿Es gratis?', 'Sí, esta versión de demostración es de uso gratuito y completo.'],
    ['¿Funciona bien en el móvil?', 'Sí, toda la interfaz está adaptada a móvil, con navegación inferior y acciones rápidas de una sola mano.'],
    ['¿Puedo instalarla como app?', 'Sí, LifeOS es una PWA instalable desde el navegador en escritorio y móvil.'],
    ['¿Puedo eliminar mi cuenta?', 'Sí, desde Ajustes → Cuenta puedes eliminar tu cuenta y todos tus datos de forma permanente.'],
  ]
  const [open, setOpen] = useState(0)
  return (
    <div style={{ marginTop: 24 }}>
      {items.map(([q, a], i) => (
        <div className="faq-item" key={q}>
          <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            {q}<span aria-hidden>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && <div className="faq-a">{a}</div>}
        </div>
      ))}
    </div>
  )
}

function PublicFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="pub-footer">
      <div className="pub-footer-grid">
        <div><Logo size={24} sub="sistema operativo personal" /></div>
        <div className="pub-footer-col"><b>Producto</b>
          <button onClick={() => scrollToId('producto')}>Producto</button>
          <button onClick={() => scrollToId('funciones')}>Funciones</button>
          <button onClick={() => scrollToId('estadisticas')}>Estadísticas</button>
        </div>
        <div className="pub-footer-col"><b>Legal</b>
          <Link to="/privacy">Privacidad</Link>
          <Link to="/terms">Términos</Link>
        </div>
        <div className="pub-footer-col"><b>Cuenta</b>
          <Link to="/login">Acceso</Link>
          <Link to="/register">Registro</Link>
          <a href="mailto:hola@lifeos.app">Contacto</a>
        </div>
      </div>
      <div className="pub-footer-bottom">
        <span>© {year} LifeOS. Todos los derechos reservados.</span>
        <span>Hecho para quienes quieren avanzar, un día a la vez.</span>
      </div>
    </footer>
  )
}

function DashboardPreview() {
  return (
    <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'left' }}>
      <div className="card" style={{ margin: 0 }}><div className="card-title">Nivel</div><b style={{ fontSize: 22 }}>Nv. 7</b><div className="pbar thin" style={{ marginTop: 8 }}><div style={{ width: '62%' }} /></div></div>
      <div className="card" style={{ margin: 0 }}><div className="card-title">Racha</div><b style={{ fontSize: 22 }}>🔥 43 días</b><div className="xs faint" style={{ marginTop: 6 }}>Momentum +12%</div></div>
      <div className="card" style={{ margin: 0 }}><div className="card-title">Hoy</div><b style={{ fontSize: 22 }}>78%</b><div className="xs faint" style={{ marginTop: 6 }}>completado</div></div>
    </div>
  )
}

// ============ LOGIN ============
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [errs, setErrs] = useState({})

  async function submit(e) {
    e.preventDefault()
    if (loading) return
    const nextErrs = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrs.email = 'Introduce un correo válido.'
    if (!password) nextErrs.password = 'Introduce tu contraseña.'
    setErrs(nextErrs)
    if (Object.keys(nextErrs).length) return
    setError('')
    setLoading(true)
    try {
      await loginUser({ email, password })
      navigate('/app/inicio')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout kicker="Bienvenido de nuevo" title="Iniciar sesión" subtitle="Entra en tu sistema personal.">
      <form onSubmit={submit} noValidate>
        {error && <div className="form-error-banner">{error}</div>}
        <div className="field">
          <label className="lbl" htmlFor="login-email">Correo electrónico</label>
          <input id="login-email" className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" aria-invalid={!!errs.email} />
          {errs.email && <div className="field-error">{errs.email}</div>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="login-pw">Contraseña</label>
          <div className="pw-field">
            <input id="login-pw" className="input" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" aria-invalid={!!errs.password} />
            <button type="button" className="pw-toggle" aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPw(s => !s)}>{showPw ? '🙈' : '👁'}</button>
          </div>
          {errs.password && <div className="field-error">{errs.password}</div>}
        </div>
        <div className="row between" style={{ marginBottom: 16 }}>
          <label className="xs muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Recordarme
          </label>
          <Link to="/forgot-password" className="xs">¿Olvidaste tu contraseña?</Link>
        </div>
        <button className="btn primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </button>
        <button type="button" className="btn sm" disabled title="Requiere conexión con Google — próximamente" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          Continuar con Google · próximamente
        </button>
      </form>
      <p className="xs muted" style={{ textAlign: 'center', marginTop: 18 }}>¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--accent)' }}>Crear cuenta</Link></p>
    </AuthLayout>
  )
}

// ============ REGISTER ============
function pwScore(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  return s
}

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [accept, setAccept] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [errs, setErrs] = useState({})
  const score = pwScore(password)

  async function submit(e) {
    e.preventDefault()
    if (loading) return
    const nextErrs = {}
    if (name.trim().length < 2) nextErrs.name = 'Introduce tu nombre.'
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrs.email = 'Introduce un correo válido.'
    if (password.length < 8) nextErrs.password = 'Mínimo 8 caracteres.'
    else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) nextErrs.password = 'Usa letras y números.'
    if (confirm !== password) nextErrs.confirm = 'Las contraseñas no coinciden.'
    if (!accept) nextErrs.accept = 'Debes aceptar los términos para continuar.'
    setErrs(nextErrs)
    if (Object.keys(nextErrs).length) return
    setError('')
    setLoading(true)
    try {
      await registerUser({ name, email, password })
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout kicker="Empieza hoy" title="Crear cuenta" subtitle="Monta tu sistema personal en unos minutos.">
      <form onSubmit={submit} noValidate>
        {error && <div className="form-error-banner">{error}</div>}
        <div className="field">
          <label className="lbl" htmlFor="reg-name">Nombre</label>
          <input id="reg-name" className="input" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" aria-invalid={!!errs.name} />
          {errs.name && <div className="field-error">{errs.name}</div>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="reg-email">Correo electrónico</label>
          <input id="reg-email" className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" aria-invalid={!!errs.email} />
          {errs.email && <div className="field-error">{errs.email}</div>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="reg-pw">Contraseña</label>
          <div className="pw-field">
            <input id="reg-pw" className="input" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" aria-invalid={!!errs.password} />
            <button type="button" className="pw-toggle" aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPw(s => !s)}>{showPw ? '🙈' : '👁'}</button>
          </div>
          {password && (
            <div className="pw-meter" aria-hidden>
              {[0, 1, 2, 3].map(i => <span key={i} style={{ background: i < score ? (score <= 1 ? 'var(--bad)' : score <= 2 ? 'var(--warn)' : 'var(--ok)') : undefined }} />)}
            </div>
          )}
          {errs.password && <div className="field-error">{errs.password}</div>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="reg-confirm">Confirmar contraseña</label>
          <input id="reg-confirm" className="input" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" aria-invalid={!!errs.confirm} />
          {errs.confirm && <div className="field-error">{errs.confirm}</div>}
        </div>
        <label className="xs muted" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
          <input type="checkbox" checked={accept} onChange={e => setAccept(e.target.checked)} style={{ marginTop: 2 }} />
          <span>Acepto los <Link to="/terms" style={{ color: 'var(--accent)' }}>Términos</Link> y la <Link to="/privacy" style={{ color: 'var(--accent)' }}>Política de privacidad</Link>.</span>
        </label>
        {errs.accept && <div className="field-error" style={{ marginTop: -10, marginBottom: 12 }}>{errs.accept}</div>}
        <button className="btn primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        <button type="button" className="btn sm" disabled title="Requiere conexión con Google — próximamente" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          Registrarse con Google · próximamente
        </button>
      </form>
      <p className="xs muted" style={{ textAlign: 'center', marginTop: 18 }}>¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent)' }}>Iniciar sesión</Link></p>
    </AuthLayout>
  )
}

// ============ FORGOT PASSWORD ============
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Introduce un correo válido.'); return }
    setErr('')
    setLoading(true)
    await requestPasswordReset(email)
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthLayout kicker="Recuperar acceso" title="Recuperar contraseña" subtitle="Te enviaremos instrucciones si la cuenta existe.">
      {sent ? (
        <div className="form-ok-banner">Si existe una cuenta asociada a <b>{email}</b>, recibirás un correo con instrucciones para restablecer tu contraseña.</div>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label className="lbl" htmlFor="fp-email">Correo electrónico</label>
            <input id="fp-email" className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
            {err && <div className="field-error">{err}</div>}
          </div>
          <button className="btn primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Enviando…' : 'Enviar instrucciones'}
          </button>
        </form>
      )}
      <p className="xs muted" style={{ textAlign: 'center', marginTop: 18 }}><Link to="/login" style={{ color: 'var(--accent)' }}>← Volver al inicio de sesión</Link></p>
    </AuthLayout>
  )
}

function AuthLayout({ kicker, title, subtitle, children }) {
  return (
    <div className="pub auth-shell">
      <div className="auth-visual">
        <HeroVideo small />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <Logo size={30} />
          <p className="muted" style={{ marginTop: 18, maxWidth: 340 }}>Tu vida, convertida en un sistema que puedes entender y mejorar.</p>
        </div>
      </div>
      <div className="auth-form-col">
        <div className="auth-card anim-in">
          <div style={{ marginBottom: 22 }}><Link to="/"><Logo size={24} /></Link></div>
          <div className="pub-kicker">{kicker}</div>
          <h1>{title}</h1>
          <p className="xs muted" style={{ marginBottom: 22 }}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

// ============ LEGAL / 404 ============
export function LegalPage({ kind }) {
  const isPrivacy = kind === 'privacy'
  return (
    <div className="pub">
      <PublicNav />
      <div className="legal-page">
        <div className="pub-kicker">Documento provisional — editable</div>
        <h1 style={{ marginTop: 8 }}>{isPrivacy ? 'Política de privacidad' : 'Términos de servicio'}</h1>
        <p className="xs muted">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        {isPrivacy ? (
          <>
            <h2>Qué datos guardamos</h2>
            <p>En esta versión, LifeOS guarda tus datos (hábitos, objetivos, registros de ánimo, sueño, finanzas y ajustes) exclusivamente en el almacenamiento local de tu navegador. No se envían a ningún servidor de terceros.</p>
            <h2>Exportación y eliminación</h2>
            <p>Puedes exportar toda tu información en JSON o CSV desde Ajustes → Datos, y eliminar tu cuenta y tus datos en cualquier momento desde Ajustes → Cuenta.</p>
            <h2>Responsable del tratamiento</h2>
            <p>[Completar con la razón social, dirección y contacto del responsable antes de publicar en producción.]</p>
          </>
        ) : (
          <>
            <h2>Uso del servicio</h2>
            <p>LifeOS se ofrece "tal cual", como herramienta personal de organización y seguimiento. No sustituye asesoramiento médico, financiero o profesional de ningún tipo.</p>
            <h2>Cuentas</h2>
            <p>Eres responsable de mantener la confidencialidad de tus credenciales de acceso en este dispositivo.</p>
            <h2>Contacto legal</h2>
            <p>[Completar con la identidad legal del titular del servicio antes de publicar en producción.]</p>
          </>
        )}
      </div>
      <PublicFooter />
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="notfound">
      <div className="big">404</div>
      <h2>Esta página no existe.</h2>
      <p className="muted">Puede que el enlace esté roto o que la página se haya movido.</p>
      <div className="row">
        <button className="btn primary" onClick={() => navigate('/')}>Ir a la portada</button>
        <button className="btn" onClick={() => navigate('/app/inicio')}>Ir a mi panel</button>
      </div>
    </div>
  )
}
