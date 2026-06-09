/**
 * ExecutiveInsightCard — displays the AI copilot's executive interpretation
 * of a graph query result.
 */

const CONFIDENCE_STYLES = {
  HIGH:   { badgeClass: 'badge-low',      icon: '●', label: 'High confidence' },
  MEDIUM: { badgeClass: 'badge-medium',   icon: '◑', label: 'Medium confidence' },
  LOW:    { badgeClass: 'badge-neutral',  icon: '○', label: 'Low confidence' },
};

export default function ExecutiveInsightCard({ insight, isLoading }) {
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1rem 1.25rem',
        background: 'rgba(124,58,237,0.06)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-md)',
      }}>
        <span className="spinner" style={{ width: 16, height: 16, flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Generating executive insight…
        </span>
      </div>
    );
  }

  if (!insight) return null;

  const conf = CONFIDENCE_STYLES[insight.confidence] || CONFIDENCE_STYLES.MEDIUM;

  return (
    <div
      className="fade-up"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.04))',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.6rem 1rem',
        background: 'rgba(124,58,237,0.1)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.95rem' }}>⚡</span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--text-accent)',
          }}>
            Executive Insight
          </span>
        </div>
        <span className={`badge ${conf.badgeClass}`} style={{ fontSize: '0.65rem' }}>
          {conf.icon} {conf.label}
        </span>
      </div>

      {/* Answer */}
      <div style={{ padding: '1rem 1.1rem' }}>
        <p style={{
          fontSize: '0.92rem', fontWeight: 500, color: 'var(--text-primary)',
          lineHeight: 1.65, margin: 0,
        }}>
          {insight.answer}
        </p>

        {/* Evidence */}
        {insight.evidence?.length > 0 && (
          <div style={{ marginTop: '0.9rem' }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem',
            }}>
              Evidence
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {insight.evidence.map((fact, i) => (
                <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended action */}
        {insight.recommended_action && insight.recommended_action !== 'null' && (
          <div style={{
            marginTop: '0.9rem',
            padding: '0.6rem 0.9rem',
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>🎯</span>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-low)', marginBottom: 3 }}>
                Recommended Action
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                {insight.recommended_action}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
