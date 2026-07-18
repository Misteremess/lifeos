import React from 'react'

// Símbolo: una "L" construida como núcleo central con tres módulos orbitando en progresión —
// evita clichés (cerebros, rayos, cohetes) y remite a "sistema personal / capas / progreso".
export function LogoMark({ size = 28, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <rect x="0.5" y="0.5" width="39" height="39" rx="11" fill="var(--accent)" />
      <path d="M14 10.5V25.5C14 27.7091 15.7909 29.5 18 29.5H27" stroke="var(--accent-contrast)" strokeWidth="3.1" strokeLinecap="round" />
      <circle cx="27" cy="15.5" r="2.6" fill="var(--accent-contrast)" opacity=".55" />
      <circle cx="27" cy="29.5" r="2.6" fill="var(--accent-contrast)" />
    </svg>
  )
}

export function Logo({ size = 28, withText = true, sub, className = '' }) {
  return (
    <div className={`lifeos-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} />
      {withText && (
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 700, fontSize: size * 0.62, letterSpacing: '-.02em' }}>LifeOS</div>
          {sub && <div className="xs faint" style={{ marginTop: 1 }}>{sub}</div>}
        </div>
      )}
    </div>
  )
}
