import PageContainer from '../components/PageContainer'

export default function Exercises() {
  return (
    <PageContainer>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-primary">Exercises</h1>
        <p className="mt-1 text-sm text-ink-muted">Your exercise library</p>
      </header>

      <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
        <p className="text-ink-muted">
          Exercise categories, details, and the add-exercise form will be
          built here in Phase 3.
        </p>
      </section>
    </PageContainer>
  )
}
