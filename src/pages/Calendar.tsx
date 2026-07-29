import PageContainer from '../components/PageContainer'

export default function Calendar() {
  return (
    <PageContainer>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-primary">Calendar</h1>
        <p className="mt-1 text-sm text-ink-muted">Monthly planning and training history</p>
      </header>

      <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
        <p className="text-ink-muted">
          The monthly calendar, day status indicators, and plan generation
          controls will be built here in Phase 4.
        </p>
      </section>
    </PageContainer>
  )
}
