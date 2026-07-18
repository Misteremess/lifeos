import React, { useEffect, useRef, useState } from 'react'

// animated number
export function Num({ value, suffix = '', decimals = 0 }) {
  const [v, setV] = useState(value)
  const raf = useRef()
  useEffect(() => {
    const from = v, to = value, t0 = performance.now()
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 500)
      setV(from + (to - from) * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [value]) // eslint-disable-line
  return <span className="mono">{v.toFixed(decimals)}{suffix}</span>
}

export function Ring({ pct, size = 84, stroke = 7, color = 'var(--accent)', children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} role="img" aria-label={`${pct}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface2)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, pct) / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.4,0,.2,1)' }} />
      <foreignObject x="0" y="0" width={size} height={size}>
        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>{children}</div>
      </foreignObject>
    </svg>
  )
}

export function Sparkline({ data, width = 140, height = 36, color = 'var(--accent)', fill = false }) {
  if (!data.length) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0)
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * width, height - 3 - ((v - min) / (max - min || 1)) * (height - 8) ])
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <svg width={width} height={height} aria-hidden="true">
      {fill && <path d={`${path} L${width},${height} L0,${height} Z`} fill={color} opacity=".12" />}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  )
}

export function Bars({ data, labels = [], width = 280, height = 90, color = 'var(--accent)', highlight = -1 }) {
  const max = Math.max(...data, 1)
  const bw = width / data.length
  return (
    <svg width={width} height={height + 16} aria-hidden="true">
      {data.map((v, i) => {
        const h = (v / max) * (height - 8)
        return <g key={i}>
          <rect x={i * bw + 3} y={height - h} width={bw - 6} height={Math.max(2, h)} rx="4"
            fill={i === highlight ? color : 'var(--surface2)'} stroke={i === highlight ? 'none' : 'var(--border)'} strokeWidth=".5">
            <animate attributeName="height" from="0" to={Math.max(2, h)} dur="0.5s" fill="freeze" />
          </rect>
          {labels[i] && <text x={i * bw + bw / 2} y={height + 12} textAnchor="middle" fontSize="9.5" fill="var(--text3)">{labels[i]}</text>}
        </g>
      })}
    </svg>
  )
}

export function Heatmap({ values, weeks = 16 }) {
  // values: array (oldest→newest) of 0..1
  const cells = values.slice(-weeks * 7)
  const level = (v) => v === 0 ? 'var(--surface2)' : `color-mix(in srgb, var(--accent) ${20 + v * 80}%, var(--surface2))`
  return (
    <div className="heat" role="img" aria-label="Calendario de actividad">
      {cells.map((v, i) => <i key={i} style={{ background: level(v) }} title={`${Math.round(v * 100)}%`} />)}
    </div>
  )
}

export function Donut({ data, size = 120 }) {
  // data: [{label, value, color}]
  const total = data.reduce((a, d) => a + d.value, 0) || 1
  let acc = 0
  const r = size / 2 - 10, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} role="img" aria-label={data.map(d => `${d.label}: ${Math.round(d.value / total * 100)}%`).join(', ')}>
      {data.map((d, i) => {
        const frac = d.value / total
        const off = c * (1 - acc); acc += frac
        return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth="14"
          strokeDasharray={`${c * frac - 2} ${c - c * frac + 2}`} strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      })}
    </svg>
  )
}

export function Modal({ onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div className={`modal ${wide ? 'wide' : ''}`}>{children}</div>
    </div>
  )
}

export function Empty({ icon, title, text, cta, onCta }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '38px 24px' }}>
      <div style={{ fontSize: 34, opacity: .5, marginBottom: 8 }} aria-hidden>{icon}</div>
      <h2 style={{ marginBottom: 6 }}>{title}</h2>
      <p className="muted small" style={{ maxWidth: 360, margin: '0 auto 16px' }}>{text}</p>
      {cta && <button className="btn primary" onClick={onCta}>{cta}</button>}
    </div>
  )
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {options.map(o => (
        <button key={o} role="tab" aria-selected={value === o} className={value === o ? 'active' : ''} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

export const Icons = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>,
  day: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  habits: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12l5 5L20 6"/></svg>,
  time: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 2h4M12 8v6M5 14a7 7 0 1 0 14 0 7 7 0 0 0-14 0z"/></svg>,
  goals: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  health: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>,
  mood: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 10h.01M15 10h.01"/></svg>,
  finance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/></svg>,
  journal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 8h6M9 12h6"/></svg>,
  stats: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M12 13v4M8 20h8"/></svg>,
  missions: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3v18M6 4h12l-2.5 4L18 12H6"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>,
  areas: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" opacity=".4"/></svg>,
  spark: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
}
