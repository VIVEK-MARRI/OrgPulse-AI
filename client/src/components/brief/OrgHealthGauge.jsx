export default function OrgHealthGauge({ score, label }) {
  const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const color = label === 'CRITICAL' ? 'var(--color-critical)'
    : label === 'WARNING' ? 'var(--color-medium)'
    : 'var(--color-low)';

  return (
    <div className="health-score">
      <div className="health-score-value" style={{ color }}>{clampedScore}</div>
      <div className="health-score-track">
        <div className="health-score-fill" style={{ width: `${clampedScore}%`, background: color }} />
      </div>
      <span className={`badge ${
        label === 'CRITICAL' ? 'badge-critical'
        : label === 'WARNING' ? 'badge-medium'
        : 'badge-low'
      }`}>
        {label}
      </span>
    </div>
  );
}
