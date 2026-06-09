import OrgHealthGauge from './OrgHealthGauge.jsx';
import { severityClass } from '../dashboard/utils.js';

// ── helpers ─────────────────────────────────────────────────────────────────

function SectionCard({ icon, title, count, children, accentColor = 'var(--accent-violet)' }) {
  return (
    <div className="section-card dashboard-section fade-up">
      <div className="section-header">
        <div className="section-icon" style={{ background: `${accentColor}22` }}>{icon}</div>
        <div className="section-title-group">
          <div className="section-title">{title}</div>
          {count !== undefined && (
            <div className="section-count">{count} item{count !== 1 ? 's' : ''}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function ProjectHealthBar({ score, health }) {
  const color = health === 'CRITICAL' ? 'var(--color-critical)'
              : health === 'WARNING'  ? 'var(--color-medium)'
              :                        'var(--color-low)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
      <div style={{
        width: 60, height: 6, background: 'var(--border-subtle)',
        borderRadius: 'var(--radius-full)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${score}%`, height: '100%',
          background: color, borderRadius: 'var(--radius-full)',
          transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

// ── Main Executive Brief Component ──────────────────────────────────────────

export default function ExecutiveBrief({ brief }) {
  if (!brief) return null;

  return (
    <div>
      {/* ── Hero row: Gauge + Leadership Summary + Intel Score ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: '1.5rem',
        alignItems: 'center',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.06))',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
      }} className="fade-up">
        {/* Gauge */}
        <OrgHealthGauge score={brief.health_score} label={brief.org_health} />

        {/* Leadership summary */}
        <div style={{ padding: '0 0.5rem' }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem',
          }}>
            ⚡ Executive Summary
          </div>
          <p style={{
            fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)',
            lineHeight: 1.5, fontStyle: 'italic',
          }}>
            "{brief.leadership_summary}"
          </p>
        </div>

        {/* Meeting Intelligence Score */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            width: 70, height: 70, borderRadius: 'var(--radius-md)',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid var(--border-glow)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2,
          }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-accent)' }}>
              {brief.meeting_intelligence_score}
            </span>
            <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Intel Score
            </span>
          </div>
        </div>
      </div>

      {/* ── Top Risks ── */}
      {brief.top_risks?.length > 0 && (
        <SectionCard icon="⚠️" title="Top Risks" count={brief.top_risks.length} accentColor="var(--color-high)">
          {brief.top_risks.map((risk) => (
            <div key={risk.rank} style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              padding: '0.75rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {/* Rank bubble */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-high)',
              }}>
                {risk.rank}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {risk.description}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${severityClass(risk.severity)}`}>{risk.severity}</span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>P: {risk.probability}</span>
                  {risk.impact_area && (
                    <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>{risk.impact_area}</span>
                  )}
                  {risk.owner && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Owner: <strong style={{ color: 'var(--text-primary)' }}>{risk.owner}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* ── Top Blockers ── */}
      {brief.top_blockers?.length > 0 && (
        <SectionCard icon="🚫" title="Top Blockers" count={brief.top_blockers.length} accentColor="var(--color-critical)">
          {brief.top_blockers.map((b, i) => (
            <div key={i} style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              padding: '0.6rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span className="blocker-dot" style={{ marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.87rem', color: 'var(--text-primary)', fontWeight: 500 }}>{b.description}</div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <span className={`badge ${severityClass(b.severity)}`}>{b.severity}</span>
                  {b.affected_project && (
                    <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>{b.affected_project}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* ── Critical Projects ── */}
      {brief.critical_projects?.length > 0 && (
        <SectionCard icon="🏗" title="Project Health" count={brief.critical_projects.length} accentColor="var(--accent-cyan)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {brief.critical_projects.map((proj, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.87rem', fontWeight: 700, color: 'var(--text-primary)' }}>{proj.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{proj.reason}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>📋 {proj.open_tasks} tasks</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>🚨 {proj.open_escalations} escalations</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>⚠️ {proj.open_risks} risks</span>
                  </div>
                </div>
                <ProjectHealthBar score={proj.project_health_score} health={proj.health} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Recommended Actions ── */}
      {brief.recommended_actions?.length > 0 && (
        <SectionCard icon="🎯" title="Recommended Actions" count={brief.recommended_actions.length} accentColor="var(--color-low)">
          {brief.recommended_actions.map((action) => (
            <div key={action.priority} style={{
              display: 'flex', gap: '0.75rem',
              padding: '0.75rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {/* Priority number */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: action.priority === 1 ? 'rgba(244,63,94,0.15)' : 'rgba(124,58,237,0.15)',
                border: `1px solid ${action.priority === 1 ? 'rgba(244,63,94,0.4)' : 'var(--border-glow)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800,
                color: action.priority === 1 ? 'var(--color-critical)' : 'var(--text-accent)',
              }}>
                {action.priority}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {action.action}
                </div>
                {action.rationale && (
                  <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                    {action.rationale}
                  </div>
                )}
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* ── Overloaded Owners + Unassigned Tasks side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Overloaded Owners */}
        <div className="section-card fade-up">
          <div className="section-header">
            <div className="section-icon" style={{ background: 'rgba(234,179,8,0.12)' }}>🔥</div>
            <div className="section-title-group">
              <div className="section-title">Overloaded Owners</div>
              <div className="section-count">{brief.overloaded_owners?.length || 0}</div>
            </div>
          </div>
          {!brief.overloaded_owners?.length ? (
            <div className="empty-state"><span className="empty-state-icon">✔</span>No overloaded owners</div>
          ) : (
            brief.overloaded_owners.map((o, i) => (
              <div key={i} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{o.name}</span>
                  <span className="badge badge-high">{o.open_task_count} tasks</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {o.tasks?.map((t, j) => (
                    <div key={j} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', borderLeft: '2px solid var(--accent-violet)' }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Unassigned Tasks */}
        <div className="section-card fade-up">
          <div className="section-header">
            <div className="section-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>❓</div>
            <div className="section-title-group">
              <div className="section-title">Unassigned Tasks</div>
              <div className="section-count">{brief.unassigned_tasks?.length || 0}</div>
            </div>
          </div>
          {!brief.unassigned_tasks?.length ? (
            <div className="empty-state"><span className="empty-state-icon">✔</span>All tasks are assigned</div>
          ) : (
            brief.unassigned_tasks.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className={`badge ${severityClass(t.priority)}`}>{t.priority}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{t.title}</div>
                  {t.project && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.project}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
