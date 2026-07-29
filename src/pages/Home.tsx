import PageContainer from '../components/PageContainer'

export default function Home() {
  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <PageContainer>
      <header className="mb-6">
        <p className="text-sm text-ink-muted">Good to see you</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-primary">{dateLabel}</h1>
      </header>

      <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
        <h2 className="text-sm font-medium text-ink-secondary">Coach summary</h2>
        <p className="mt-2 text-ink-muted">
          Your coach summary, today's plan, and workout generation will appear
          here once the data and planning systems are built in later phases.
        </p>
      </section>
    </PageContainer>
  )
}
