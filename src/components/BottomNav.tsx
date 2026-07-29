import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

// Icons kept as small inline SVGs (no icon library dependency) — each is
// intentionally simple and line-based to match the calm, uncluttered
// direction the spec calls for.
const icons: Record<string, ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17" strokeLinecap="round" />
      <path d="M8 3v3.5M16 3v3.5" strokeLinecap="round" />
    </svg>
  ),
  exercises: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
      <path d="M6.5 7 4 9.5l3 3M17.5 7 20 9.5l-3 3M9.5 4 8 20M15 4l-1.5 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.8 6.2l-1.55 1.55M7.75 16.25 6.2 17.8M17.8 17.8l-1.55-1.55M7.75 7.75 6.2 6.2" strokeLinecap="round" />
    </svg>
  ),
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: icons.home },
  { to: '/calendar', label: 'Calendar', icon: icons.calendar },
  { to: '/exercises', label: 'Exercises', icon: icons.exercises },
  { to: '/edit-app', label: 'Edit App', icon: icons.edit },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-2/95 backdrop-blur supports-[backdrop-filter]:bg-surface-2/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {navItems.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors',
                  isActive ? 'text-accent' : 'text-ink-muted hover:text-ink-secondary',
                ].join(' ')
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
