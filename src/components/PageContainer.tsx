import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
}

/**
 * Wraps every page's content. Centers on wider (desktop/tablet) viewports
 * while staying full-bleed on phones, and reserves space at the bottom so
 * content never sits underneath the fixed BottomNav.
 */
export default function PageContainer({ children }: PageContainerProps) {
  return (
    <div
      className="mx-auto min-h-screen max-w-md px-4 pb-28"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      {children}
    </div>
  )
}
