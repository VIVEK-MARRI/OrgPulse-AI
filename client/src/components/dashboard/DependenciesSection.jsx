import { depTypeClass } from './utils.js';

const DEP_ARROWS = {
  BLOCKS:     { icon: '🚫', label: 'blocks' },
  REQUIRES:   { icon: '⟶', label: 'requires' },
  WAITING_ON: { icon: '⏳', label: 'waiting on' },
};

export default function DependenciesSection({ dependencies }) {
  return (
    <div className="dashboard-section fade-up">
      <div className="section-card">
        <div className="section-header">
          <div className="section-icon" style={{ background: 'rgba(234,179,8,0.12)' }}>🔗</div>
          <div className="section-title-group">
            <div className="section-title">Dependencies</div>
            <div className="section-count">{dependencies.length} item{dependencies.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {dependencies.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔗</span>
            No dependencies identified
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {dependencies.map(dep => {
              const arrow = DEP_ARROWS[dep.type] || { icon: '→', label: dep.type };
              return (
                <div className="dep-card" key={dep.id}>
                  {/* From */}
                  <div className="dep-entity" title={dep.from_entity}>
                    {dep.from_entity}
                  </div>

                  {/* Arrow */}
                  <div className="dep-arrow">
                    <span className="dep-arrow-line">
                      <span className={`badge ${depTypeClass(dep.type)}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        {arrow.label}
                      </span>
                    </span>
                    <span className="dep-arrow-icon">{arrow.icon}</span>
                  </div>

                  {/* To */}
                  <div className="dep-entity" style={{ textAlign: 'right', color: 'var(--text-accent)' }} title={dep.to_entity}>
                    {dep.to_entity}
                  </div>

                  {/* ID */}
                  <span className="badge badge-neutral font-mono text-xs" style={{ flexShrink: 0 }}>
                    {dep.id}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
