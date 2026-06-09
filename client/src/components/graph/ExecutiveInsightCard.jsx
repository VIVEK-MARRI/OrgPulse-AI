const CONFIDENCE_STYLES = {
  HIGH: { badgeClass: 'badge-low', label: 'High confidence' },
  MEDIUM: { badgeClass: 'badge-medium', label: 'Medium confidence' },
  LOW: { badgeClass: 'badge-neutral', label: 'Low confidence' },
};

export default function ExecutiveInsightCard({ insight, isLoading }) {
  if (isLoading) {
    return (
      <div className="insight-card loading">
        <span className="spinner spinner-sm" />
        <span>Generating executive insight...</span>
      </div>
    );
  }

  if (!insight) return null;

  const conf = CONFIDENCE_STYLES[insight.confidence] || CONFIDENCE_STYLES.MEDIUM;

  return (
    <div className="insight-card fade-up">
      <div className="insight-card-header">
        <span className="eyebrow">Executive Insight</span>
        <span className={`badge ${conf.badgeClass}`}>{conf.label}</span>
      </div>

      <div className="insight-card-body">
        <p>{insight.answer}</p>

        {insight.evidence?.length > 0 && (
          <div className="insight-section">
            <div className="eyebrow">Evidence</div>
            <ul>
              {insight.evidence.map((fact, i) => <li key={i}>{fact}</li>)}
            </ul>
          </div>
        )}

        {insight.recommended_action && insight.recommended_action !== 'null' && (
          <div className="insight-action">
            <div className="eyebrow">Recommended Action</div>
            <div>{insight.recommended_action}</div>
          </div>
        )}
      </div>
    </div>
  );
}
