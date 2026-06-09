import { useState, useCallback, useRef } from 'react';
import './graph.css';
import { highlightCypher, SAMPLE_QUESTIONS } from './cypherHighlight.js';
import ExecutiveInsightCard from './ExecutiveInsightCard.jsx';

const API_BASE = '';

export default function GraphQueryPanel({ extraction, apiKeyOverride }) {
  const [question, setQuestion] = useState('');
  const [cypher, setCypher] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [boltUrl, setBoltUrl] = useState('bolt://localhost:7687');
  const [neo4jUser, setNeo4jUser] = useState('neo4j');
  const [neo4jPass, setNeo4jPass] = useState('');
  const [showNeo4jConfig, setShowNeo4jConfig] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState(null);
  const [queryResults, setQueryResults] = useState(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [ingestError, setIngestError] = useState(null);
  const inputRef = useRef(null);

  const fetchInsight = useCallback(async (q, cql, rows) => {
    setInsightLoading(true);
    setInsight(null);
    try {
      const res = await fetch(`${API_BASE}/api/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, cypher: cql, results: rows || [], apiKeyOverride }),
      });
      const json = await res.json();
      if (res.ok && json.success) setInsight(json.data);
    } catch {
      // Insight is best-effort.
    } finally {
      setInsightLoading(false);
    }
  }, [apiKeyOverride]);

  const generateCypher = useCallback(async (q) => {
    const q2 = (q || question).trim();
    if (!q2) return;
    setQueryLoading(true);
    setQueryError(null);
    setCypher('');
    setQueryResults(null);
    setInsight(null);

    try {
      const res = await fetch(`${API_BASE}/api/cypher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q2, apiKeyOverride }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Error ${res.status}`);

      const generatedQuery = json.query || '';
      setCypher(generatedQuery);
      fetchInsight(q2, generatedQuery, extractionToSurrogateResults(q2, extraction));
    } catch (err) {
      setQueryError(err.message);
    } finally {
      setQueryLoading(false);
    }
  }, [question, apiKeyOverride, extraction, fetchInsight]);

  const runQuery = useCallback(async () => {
    if (!cypher) return;
    setRunLoading(true);
    setRunError(null);
    setQueryResults(null);
    setInsight(null);

    try {
      const res = await fetch(`${API_BASE}/api/neo4j/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cypher, boltUrl, username: neo4jUser, password: neo4jPass }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Neo4j error ${res.status}`);

      const results = { columns: json.columns, rows: json.rows };
      setQueryResults(results);
      fetchInsight(question, cypher, json.rows);
    } catch (err) {
      setRunError(err.message);
    } finally {
      setRunLoading(false);
    }
  }, [cypher, boltUrl, neo4jUser, neo4jPass, question, fetchInsight]);

  const pushToGraph = useCallback(async () => {
    if (!extraction) return;
    setIngestLoading(true);
    setIngestError(null);
    setIngestResult(null);
    const meetingId = `meeting_${Date.now()}`;
    try {
      const res = await fetch(`${API_BASE}/api/neo4j/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractionData: extraction, meetingId, boltUrl, username: neo4jUser, password: neo4jPass }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Neo4j error ${res.status}`);
      setIngestResult(json);
    } catch (err) {
      setIngestError(err.message);
    } finally {
      setIngestLoading(false);
    }
  }, [extraction, boltUrl, neo4jUser, neo4jPass]);

  const copyQuery = useCallback(async () => {
    if (!cypher) return;
    try {
      await navigator.clipboard.writeText(cypher);
    } catch {
      const el = document.createElement('textarea');
      el.value = cypher;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  }, [cypher]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generateCypher();
    }
  };

  const useSampleQuestion = (q) => {
    setQuestion(q);
    generateCypher(q);
    inputRef.current?.focus();
  };

  return (
    <div className="graph-panel">
      <div>
        <div className="graph-toolbar">
          <div>
            <div className="section-title">Knowledge Graph Query</div>
            <div className="section-count">Generate and inspect Cypher against organizational data.</div>
          </div>
          <button
            id="btn-neo4j-config"
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowNeo4jConfig(s => !s)}
          >
            Neo4j {showNeo4jConfig ? 'Hide' : 'Configure'}
          </button>
        </div>

        {showNeo4jConfig && (
          <div className="neo4j-config">
            <div className="form-group neo4j-config-full">
              <label className="form-label" htmlFor="neo4j-url">Bolt URL</label>
              <input id="neo4j-url" type="text" className="form-input" value={boltUrl} onChange={e => setBoltUrl(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="neo4j-user">Username</label>
              <input id="neo4j-user" type="text" className="form-input" value={neo4jUser} onChange={e => setNeo4jUser(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="neo4j-pass">Password</label>
              <input id="neo4j-pass" type="password" className="form-input" value={neo4jPass} onChange={e => setNeo4jPass(e.target.value)} placeholder="Password" />
            </div>
          </div>
        )}
      </div>

      {extraction && (
        <div className="push-banner">
          <div>
            <div className="item-title">Push this meeting to the knowledge graph</div>
            <div className="text-sm text-muted">Creates nodes for tasks, risks, people, escalations, and decisions in Neo4j.</div>
          </div>
          <button id="btn-push-graph" type="button" className="btn btn-secondary btn-sm" onClick={pushToGraph} disabled={ingestLoading}>
            {ingestLoading ? <><span className="spinner spinner-xs" /> Pushing...</> : 'Push'}
          </button>
        </div>
      )}

      {ingestResult && (
        <div className={`ingest-result ${ingestResult.errors > 0 ? 'has-errors' : ''}`}>
          <span>Ingested <strong>{ingestResult.statementsRun}</strong> statements{ingestResult.errors > 0 ? ` (${ingestResult.errors} errors)` : ' successfully.'}</span>
        </div>
      )}
      {ingestError && <div className="error-banner" role="alert">Neo4j ingest failed: {ingestError}</div>}

      <div>
        <div className="graph-input-label-row">
          <div className="eyebrow">Ask a question about organizational data</div>
          <span className="form-help">Ctrl+Enter to generate</span>
        </div>
        <div className="graph-question-area">
          <textarea
            id="graph-question-input"
            ref={inputRef}
            className="graph-question-input"
            placeholder='e.g. "Who owns the most pending tasks?" or "Which projects are at risk?"'
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            spellCheck={false}
          />
          <button id="btn-generate-cypher" type="button" className="btn btn-primary" onClick={() => generateCypher()} disabled={queryLoading || !question.trim()}>
            {queryLoading ? <><span className="spinner spinner-xs" /> Generating...</> : 'Generate'}
          </button>
        </div>
        {queryError && <div className="error-banner graph-error" role="alert">{queryError}</div>}
      </div>

      <div>
        <div className="eyebrow examples-label">Quick examples</div>
        <div className="sample-chips">
          {SAMPLE_QUESTIONS.map((q, i) => (
            <button key={i} type="button" className="sample-chip" onClick={() => useSampleQuestion(q)}>{q}</button>
          ))}
        </div>
      </div>

      {(insightLoading || insight) && <ExecutiveInsightCard insight={insight} isLoading={insightLoading} />}

      {cypher && (
        <div>
          <div className="cypher-block">
            <div className="cypher-block-toolbar">
              <span className="cypher-label">Generated Cypher</span>
              <div className="flex gap-2">
                <button id="btn-copy-cypher" type="button" className="btn btn-ghost btn-sm" onClick={copyQuery}>
                  {copiedQuery ? 'Copied' : 'Copy'}
                </button>
                <button id="btn-run-cypher" type="button" className="btn btn-primary btn-sm" onClick={runQuery} disabled={runLoading}>
                  {runLoading ? <><span className="spinner spinner-xs" /> Running...</> : 'Run on Neo4j'}
                </button>
              </div>
            </div>
            <div className="cypher-content" dangerouslySetInnerHTML={{ __html: highlightCypher(cypher) }} aria-label="Generated Cypher query" />
          </div>
          {runError && <div className="error-banner graph-error">{runError}</div>}
        </div>
      )}

      {queryResults && (
        <div>
          <div className="eyebrow examples-label">Results: {queryResults.rows.length} row{queryResults.rows.length !== 1 ? 's' : ''}</div>
          {queryResults.rows.length === 0 ? (
            <div className="empty-state">Query returned no results</div>
          ) : (
            <div className="results-table-wrap">
              <table className="results-table">
                <thead><tr>{queryResults.columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
                <tbody>
                  {queryResults.rows.map((row, i) => (
                    <tr key={i}>
                      {queryResults.columns.map(col => (
                        <td key={col} title={String(row[col] ?? '')}>
                          {row[col] === null || row[col] === undefined
                            ? <span className="text-muted">null</span>
                            : typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!cypher && !queryLoading && (
        <div className="empty-state">
          Ask a question above to generate a Cypher query and get an executive insight. Connect Neo4j to run it live against your knowledge graph.
        </div>
      )}
    </div>
  );
}

function extractionToSurrogateResults(question, extraction) {
  if (!extraction) return [];
  const q = question.toLowerCase();

  if (q.includes('task') || q.includes('action') || q.includes('owner') || q.includes('pending') || q.includes('assigned')) {
    return (extraction.tasks || []).map(t => ({ task_id: t.id, title: t.title, owner: t.owner || null, priority: t.priority, deadline: t.deadline || null, status: t.status }));
  }
  if (q.includes('escalation') || q.includes('escalated') || q.includes('blocker')) {
    return (extraction.escalations || []).map(e => ({ escalation_id: e.id, description: e.description, severity: e.severity, is_blocker: e.is_blocker, raised_by: e.raised_by || null, escalated_to: e.escalated_to || null }));
  }
  if (q.includes('risk') || q.includes('project') || q.includes('at risk')) {
    return (extraction.risks || []).map(r => ({ risk_id: r.id, description: r.description, severity: r.severity, probability: r.probability, impact_area: r.impact_area || null, trigger: r.trigger || null }));
  }
  if (q.includes('decision') || q.includes('committed') || q.includes('deferred')) {
    return (extraction.decisions || []).map(d => ({ decision_id: d.id, description: d.description, type: d.type, made_by: d.made_by || null }));
  }
  if (q.includes('stakeholder') || q.includes('participant') || q.includes('who')) {
    return (extraction.stakeholders || []).map(s => ({ name: s.name, team: s.team || null, role: s.role_in_meeting || null }));
  }
  if (q.includes('depend') || q.includes('blocks') || q.includes('waiting')) {
    return (extraction.dependencies || []).map(d => ({ dep_id: d.id, description: d.description, type: d.type, from: d.from_entity, to: d.to_entity }));
  }

  return [{
    meeting: extraction.meeting?.title || 'Unknown',
    tasks: extraction.tasks?.length || 0,
    risks: extraction.risks?.length || 0,
    escalations: extraction.escalations?.length || 0,
    decisions: extraction.decisions?.length || 0,
    stakeholders: extraction.stakeholders?.length || 0,
    dependencies: extraction.dependencies?.length || 0,
  }];
}
