import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-surface-0 hover:bg-accent/90 active:bg-accent/80',
  secondary: 'bg-surface-2 text-ink-primary hover:bg-surface-3 active:bg-surface-3',
  ghost: 'bg-transparent text-ink-secondary hover:bg-surface-2 active:bg-surface-2',
  danger: 'bg-status-missed/15 text-status-missed hover:bg-status-missed/25',
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
