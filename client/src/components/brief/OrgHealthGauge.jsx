/**
 * OrgHealthGauge — animated radial gauge showing health score 0–100
 */
export default function OrgHealthGauge({ score, label }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference * (1 - clampedScore / 100);

  // Color based on label
  const color = label === 'CRITICAL' ? 'var(--color-critical)'
              : label === 'WARNING'  ? 'var(--color-medium)'
              :                        'var(--color-low)';

  const trackColor = label === 'CRITICAL' ? 'rgba(244,63,94,0.1)'
                   : label === 'WARNING'  ? 'rgba(234,179,8,0.1)'
                   :                        'rgba(34,197,94,0.1)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ overflow: 'visible' }}>
        {/* Glow filter */}
        <defs>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Track circle */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth="10"
        />

        {/* Progress arc */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 70 70)"
          filter="url(#gauge-glow)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />

        {/* Score text */}
        <text x="70" y="66" textAnchor="middle" fill={color}
          fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">
          {clampedScore}
        </text>
        <text x="70" y="84" textAnchor="middle" fill="var(--text-muted)"
          fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="0.06em">
          / 100
        </text>
      </svg>

      {/* Label badge */}
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color,
          background: trackColor,
          border: `1px solid ${color}`,
          padding: '3px 12px',
          borderRadius: 'var(--radius-full)',
        }}
      >
        {label}
      </span>
    </div>
  );
}
