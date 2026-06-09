import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [boltUrl, setBoltUrl] = useState('bolt://localhost:7687');
  const [neo4jUser, setNeo4jUser] = useState('neo4j');
  const [neo4jPass, setNeo4jPass] = useState('');
  const [healthStatus, setHealthStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/health');
      const json = await res.json();
      setHealthStatus(json);
    } catch {
      setHealthStatus({ status: 'error', message: 'Server unreachable' });
    } finally {
      setChecking(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { checkHealth(); }, []);

  const clearMemory = async () => {
    if (!window.confirm('Clear all organizational memory? This cannot be undone.')) return;
    try {
      await fetch('/api/recurring', { method: 'DELETE' });
    } catch { /* ignore */ }
  };

  const serverOk = healthStatus?.status === 'ok';

  return (
    <div>
      <PageHeader title="Settings" description="Application configuration" />

      <div className="settings-section">
        <div className="settings-section-title">API Configuration</div>
        <Card>
          <CardBody>
            <div className="settings-field">
              <div>
                <div className="settings-field-label">OpenRouter API Key</div>
                <div className="settings-field-description">Configured via server .env or per-request override</div>
              </div>
              <input
                type="password"
                className="form-input settings-input"
                placeholder="sk-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <div>
                <div className="settings-field-label">Server Status</div>
                <div className="settings-field-description">OrgPulse API health check</div>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant={serverOk ? 'low' : 'critical'}>
                  {serverOk ? 'Connected' : 'Disconnected'}
                </Badge>
                <button className="btn btn-ghost btn-sm" onClick={checkHealth} disabled={checking}>
                  {checking ? 'Checking...' : 'Test'}
                </button>
              </div>
            </div>
            {healthStatus && (
              <div className="text-sm text-muted" style={{ padding: '8px 0' }}>
                API Key Configured: {healthStatus.openRouterKeyConfigured ? 'Yes' : 'No'}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Neo4j Connection</div>
        <Card>
          <CardBody>
            <div className="settings-field">
              <div>
                <div className="settings-field-label">Bolt URL</div>
                <div className="settings-field-description">Neo4j database connection endpoint</div>
              </div>
              <input
                type="text"
                className="form-input settings-input"
                value={boltUrl}
                onChange={e => setBoltUrl(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <div>
                <div className="settings-field-label">Username</div>
                <div className="settings-field-description">Neo4j authentication</div>
              </div>
              <input
                type="text"
                className="form-input settings-input"
                value={neo4jUser}
                onChange={e => setNeo4jUser(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <div>
                <div className="settings-field-label">Password</div>
                <div className="settings-field-description">Neo4j authentication</div>
              </div>
              <input
                type="password"
                className="form-input settings-input"
                placeholder="Enter password"
                value={neo4jPass}
                onChange={e => setNeo4jPass(e.target.value)}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Organizational Memory</div>
        <Card>
          <CardBody>
            <div className="settings-field">
              <div>
                <div className="settings-field-label">Memory Store</div>
                <div className="settings-field-description">JSON file-backed vector store for recurring issue detection</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={clearMemory}>
                Clear Memory
              </button>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Application</div>
        <Card>
          <CardBody>
            <div className="settings-field">
              <div>
                <div className="settings-field-label">Version</div>
                <div className="settings-field-description">OrgPulse AI</div>
              </div>
              <span className="text-sm text-muted">1.0.0</span>
            </div>
            <div className="settings-field">
              <div>
                <div className="settings-field-label">Last Analysis</div>
                <div className="settings-field-description">Local storage cache</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                try { localStorage.removeItem('orgpulse_last_analysis'); window.location.reload(); } catch { /* ignore */ }
              }}>
                Clear Cache
              </button>
            </div>
            <div className="settings-field" style={{ borderBottom: 'none' }}>
              <div>
                <div className="settings-field-label">Health Status</div>
                <div className="settings-field-description">Server connectivity and configuration</div>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`status-dot ${serverOk ? 'status-dot-success' : 'status-dot-danger'}`} />
                <span className="text-sm">{serverOk ? 'All systems operational' : 'Server unreachable'}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
