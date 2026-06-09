import { severityClass, formatDate } from './utils.js';

export default function TasksSection({ tasks }) {
  return (
    <div className="dashboard-section fade-up">
      <div className="section-card">
        <div className="section-header">
          <div className="section-icon" style={{ background: 'rgba(124,58,237,0.15)' }}>✅</div>
          <div className="section-title-group">
            <div className="section-title">Tasks &amp; Action Items</div>
            <div className="section-count">{tasks.length} item{tasks.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📋</span>
            No tasks identified
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Task</th>
                  <th>Owner</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <span className="badge badge-neutral font-mono text-xs">{task.id}</span>
                    </td>
                    <td>
                      <div className="task-title-cell">{task.title}</div>
                      {task.source_quote && (
                        <div className="source-quote">"{task.source_quote}"</div>
                      )}
                    </td>
                    <td>
                      {task.owner
                        ? <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.82rem' }}>{task.owner}</span>
                        : <span className="text-muted text-xs">Unassigned</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${severityClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      {task.deadline
                        ? <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{formatDate(task.deadline)}</span>
                        : <span className="text-muted text-xs">—</span>
                      }
                    </td>
                    <td>
                      <span className="badge badge-cyan">{task.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
