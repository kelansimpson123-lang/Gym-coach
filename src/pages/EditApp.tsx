import PageContainer from '../components/PageContainer'

export default function EditApp() {
  return (
    <PageContainer>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-primary">Edit App</h1>
        <p className="mt-1 text-sm text-ink-muted">Settings and customisation</p>
      </header>

      <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
        <p className="text-ink-muted">
          Training split management, Coach settings, schedule, progression,
          cardio, and general settings will be built here across later phases.
        </p>
      </section>
    </PageContainer>
  )
}
