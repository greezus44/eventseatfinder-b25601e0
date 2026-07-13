export function DashboardPage() {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary">
            Manage your events and seating arrangements.
          </p>
        </div>
      </div>
      <div className="page__body">
        <div className="card card--hover">
          <h3 style={{ marginBottom: 'var(--space-2)' }}>No events yet</h3>
          <p className="text-secondary">
            Create your first event to get started with seating management.
          </p>
        </div>
      </div>
    </div>
  );
}
