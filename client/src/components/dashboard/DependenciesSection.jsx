import { depTypeClass } from './utils.js';

const DEP_ARROWS = {
  BLOCKS: { label: 'blocks' },
  REQUIRES: { label: 'requires' },
  WAITING_ON: { label: 'waiting on' },
};

export default function DependenciesSection({ dependencies }) {
  return (
    <div className="dashboard-section fade-up">
      <div className="section-card">
        <div className="section-header">
          <div className="section-icon" aria-hidden="true" />
          <div className="section-title-group">
            <div className="section-title">Dependencies</div>
            <div className="section-count">{dependencies.length} item{dependencies.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {dependencies.length === 0 ? (
          <div className="empty-state">No dependencies identified</div>
        ) : (
          <div className="dependency-list">
            {dependencies.map(dep => {
              const arrow = DEP_ARROWS[dep.type] || { label: dep.type };
              return (
                <div className="dep-card" key={dep.id}>
                  <div className="dep-entity" title={dep.from_entity}>{dep.from_entity}</div>
                  <div className="dep-arrow">
                    <span className={`badge ${depTypeClass(dep.type)}`}>{arrow.label}</span>
                  </div>
                  <div className="dep-entity dep-entity-target" title={dep.to_entity}>{dep.to_entity}</div>
                  <span className="badge badge-neutral font-mono text-xs">{dep.id}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
