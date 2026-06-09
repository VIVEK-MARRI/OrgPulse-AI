const API_BASE = '';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
  return json;
}

export const api = {
  health: () => request('GET', '/api/health'),

  analyze: (transcript, meetingTitle, referenceDate, apiKeyOverride) =>
    request('POST', '/api/analyze', { transcript, meetingTitle, referenceDate, apiKeyOverride }),

  brief: (extractionData, apiKeyOverride) =>
    request('POST', '/api/brief', { extractionData, apiKeyOverride }),

  cypher: (question, apiKeyOverride) =>
    request('POST', '/api/cypher', { question, apiKeyOverride }),

  neo4jRun: (query, boltUrl, username, password) =>
    request('POST', '/api/neo4j/run', { query, boltUrl, username, password }),

  neo4jIngest: (extractionData, meetingId, boltUrl, username, password) =>
    request('POST', '/api/neo4j/ingest', { extractionData, meetingId, boltUrl, username, password }),

  insight: (question, cypher, results, apiKeyOverride) =>
    request('POST', '/api/insight', { question, cypher, results, apiKeyOverride }),

  recurringAnalyze: (extractionData, apiKeyOverride) =>
    request('POST', '/api/recurring/analyze', { extractionData, apiKeyOverride }),

  recurringGetAll: () => request('GET', '/api/recurring'),

  recurringReset: () => request('DELETE', '/api/recurring'),
};
