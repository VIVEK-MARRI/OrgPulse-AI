export function StatCard({ label, value, change, changeType = 'neutral' }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value ?? '--'}</div>
      {change !== undefined && (
        <div className={`stat-card-change ${changeType}`}>
          {change}
        </div>
      )}
    </div>
  );
}
