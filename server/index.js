import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import { buildPrompt }          from './prompt.js';
import { buildExecutivePrompt } from './executiveBriefPrompt.js';
import { buildCypherPrompt, buildIngestStatements } from './cypherPrompt.js';
import { buildInsightPrompt }   from './insightPrompt.js';
import { callGemini }           from './geminiHelper.js';
import { analyzeForRecurring, getAllRecurringIssues, resetMemory } from './services/recurring.service.js';
import neo4j from 'neo4j-driver';

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '8mb' }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
  ],
  methods: ['GET', 'POST', 'DELETE'],
}));

// ─── Helper: resolve & validate API key ───────────────────────────────────────
function resolveKey(override, res) {
  const key = (override && override.trim()) || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!key) {
    res.status(401).json({
      error: 'MISSING_API_KEY',
      message: 'No API key found. Set GEMINI_API_KEY or OPENROUTER_API_KEY in .env or provide apiKeyOverride.',
    });
    return null;
  }
  return key;
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const started = Date.now();

  const diagnostics = {
    server: { status: 'ok' },
    ai: { available: false, configured: !!process.env.GEMINI_API_KEY || !!process.env.OPENROUTER_API_KEY },
    neo4j: { available: false },
    chroma: { available: false },
    durationMs: 0,
  };

  // OpenRouter: if API key is configured we consider it "available".
  // (Avoid making calls that would require a keyless environment.)
  if (process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY) diagnostics.ai.available = true;

  // Neo4j: lightweight connectivity test
  try {
    const boltUrl = process.env.NEO4J_URL || 'bolt://localhost:7687';
    const username = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || '';

    const driver = neo4j.driver(boltUrl, neo4j.auth.basic(username, password));
    const session = driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
      await session.run('RETURN 1 AS ok LIMIT 1');
      diagnostics.neo4j.available = true;
    } finally {
      await session.close();
      await driver.close();
    }
  } catch {
    diagnostics.neo4j.available = false;
  }

  // Chroma/Memory: ensure module can be imported
  try {
    await import('./services/chroma.service.js');
    diagnostics.chroma.available = true;
  } catch {
    diagnostics.chroma.available = false;
  }

  diagnostics.durationMs = Date.now() - started;
  res.json({ success: true, diagnostics });
});


// ─── Analyze ──────────────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const started = Date.now();
  const { transcript, meetingTitle, referenceDate, apiKeyOverride } = req.body;


  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return res.status(400).json({
      error: 'MISSING_TRANSCRIPT',
      message: 'The "transcript" field is required and must be a non-empty string.',
    });
  }

  const apiKey = resolveKey(apiKeyOverride, res);
  if (!apiKey) return;

  const today = referenceDate || new Date().toISOString().slice(0, 10);
  const { system, user } = buildPrompt(transcript.trim(), meetingTitle, today);

  try {
    const parsed = await callGemini(apiKey, system, user);

    const required = ['meeting', 'tasks', 'escalations', 'risks', 'decisions', 'stakeholders', 'dependencies'];
    const missing  = required.filter(k => !(k in parsed));
    if (missing.length) return res.status(502).json({ error: 'INCOMPLETE_RESPONSE', message: `Missing keys: ${missing.join(', ')}`, partial: parsed });

    res.json({
      success: true,
      data: parsed,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    console.error('[analyze]', err.message);
    handleGeminiError(err, res);
  }
});


// ─── Executive Brief ──────────────────────────────────────────────────────────
app.post('/api/brief', async (req, res) => {
  const started = Date.now();
  const { extractionData, apiKeyOverride } = req.body;

  if (!extractionData) return res.status(400).json({ error: 'MISSING_EXTRACTION_DATA' });

  const apiKey = resolveKey(apiKeyOverride, res);
  if (!apiKey) return;

  try {
    const { system, user } = buildExecutivePrompt(extractionData);
    const parsed = await callGemini(apiKey, system, user);

    const required = ['org_health','health_score','leadership_summary','top_risks',
      'top_blockers','critical_projects','overloaded_owners','unassigned_tasks',
      'recommended_actions','meeting_intelligence_score'];
    const missing = required.filter(k => !(k in parsed));
    if (missing.length) return res.status(502).json({ error: 'INCOMPLETE_RESPONSE', message: `Missing: ${missing.join(', ')}`, partial: parsed });

    res.json({
      success: true,
      data: parsed,
      durationMs: Date.now() - started,
    });
  } catch (err) { console.error('[brief]', err.message); handleGeminiError(err, res); }
});


// ─── Cypher Query Generator ───────────────────────────────────────────────────
app.post('/api/cypher', async (req, res) => {
  const { question, apiKeyOverride } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: 'MISSING_QUESTION' });

  const apiKey = resolveKey(apiKeyOverride, res);
  if (!apiKey) return;

  try {
    const { system, user } = buildCypherPrompt(question.trim());
    const text = await callGemini(apiKey, system, user, { json: false, maxTokens: 2048 });
    let query = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    const writeOp = /\b(CREATE|MERGE|DELETE|SET|REMOVE|DROP|CALL|LOAD\s+CSV)\b/i;
    if (writeOp.test(query)) return res.status(400).json({ error: 'WRITE_OPERATION_BLOCKED', query });

    res.json({ success: true, query });
  } catch (err) { console.error('[cypher]', err.message); handleGeminiError(err, res); }
});

// ─── Neo4j Executor ───────────────────────────────────────────────────────────
app.post('/api/neo4j/run', async (req, res) => {
  const { query, boltUrl = process.env.NEO4J_URL || 'bolt://localhost:7687',
          username = process.env.NEO4J_USER || 'neo4j',
          password = process.env.NEO4J_PASSWORD || '' } = req.body;

  if (!query) return res.status(400).json({ error: 'MISSING_QUERY' });
  const writeOp = /\b(CREATE|MERGE|DELETE|SET|REMOVE|DROP|CALL|LOAD\s+CSV)\b/i;
  if (writeOp.test(query)) return res.status(400).json({ error: 'WRITE_OPERATION_BLOCKED' });

  const driver  = neo4j.driver(boltUrl, neo4j.auth.basic(username, password), { connectionTimeoutMs: 5000 });
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(query);
    const rows = result.records.map(r => {
      const obj = {};
      r.keys.forEach(k => {
        const v = r.get(k);
        obj[k] = neo4j.isInt(v) ? v.toNumber() : (v?.properties ?? v);
      });
      return obj;
    });
    res.json({ success: true, rows, columns: result.records[0]?.keys || [] });
  } catch (err) { res.status(500).json({ error: 'NEO4J_ERROR', message: err.message }); }
  finally { await session.close(); await driver.close(); }
});

// ─── Neo4j Ingest ─────────────────────────────────────────────────────────────
app.post('/api/neo4j/ingest', async (req, res) => {
  const { extractionData, meetingId,
          boltUrl = process.env.NEO4J_URL || 'bolt://localhost:7687',
          username = process.env.NEO4J_USER || 'neo4j',
          password = process.env.NEO4J_PASSWORD || '' } = req.body;

  if (!extractionData || !meetingId) return res.status(400).json({ error: 'MISSING_FIELDS' });

  const stmts = buildIngestStatements(extractionData, meetingId);
  const driver  = neo4j.driver(boltUrl, neo4j.auth.basic(username, password), { connectionTimeoutMs: 5000 });
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
  const results = []; let errors = 0;
  try {
    for (const s of stmts) {
      try { await session.run(s); results.push({ ok: true }); }
      catch (e) { results.push({ ok: false, error: e.message }); errors++; }
    }
    res.json({ success: true, statementsRun: stmts.length, errors, results });
  } catch (err) { res.status(500).json({ error: 'NEO4J_ERROR', message: err.message }); }
  finally { await session.close(); await driver.close(); }
});

// ─── Executive Insight ────────────────────────────────────────────────────────
app.post('/api/insight', async (req, res) => {
  const started = Date.now();
  const { question, cypher, results, apiKeyOverride } = req.body;

  if (!question || !cypher) return res.status(400).json({ error: 'MISSING_FIELDS' });

  const apiKey = resolveKey(apiKeyOverride, res);
  if (!apiKey) return;

  try {
    const { system, user } = buildInsightPrompt(question, cypher, Array.isArray(results) ? results : []);
    const parsed = await callGemini(apiKey, system, user);

    const required = ['answer','evidence','recommended_action','confidence'];
    const missing  = required.filter(k => !(k in parsed));
    if (missing.length) return res.status(502).json({ error: 'INCOMPLETE_RESPONSE', message: `Missing: ${missing.join(', ')}`, partial: parsed });

    if (!['HIGH','MEDIUM','LOW'].includes(parsed.confidence)) parsed.confidence = 'MEDIUM';
    if (!Array.isArray(parsed.evidence)) parsed.evidence = [];

    res.json({
      success: true,
      data: parsed,
      durationMs: Date.now() - started,
    });
  } catch (err) { console.error('[insight]', err.message); handleGeminiError(err, res); }
});


// ─── Recurring Issue Analysis ─────────────────────────────────────────────────
app.post('/api/recurring/analyze', async (req, res) => {
  const started = Date.now();
  const { extractionData, apiKeyOverride } = req.body;


  if (!extractionData || typeof extractionData !== 'object') {
    return res.status(400).json({
      error: 'MISSING_EXTRACTION_DATA',
      message: '"extractionData" is required.',
    });
  }

  const apiKey = resolveKey(apiKeyOverride, res);
  if (!apiKey) return;

  try {
    const result = await analyzeForRecurring(extractionData, apiKey);
    const recurringIssues = Array.isArray(result) ? result : (result?.clusters || []);
    const stageErrors = Array.isArray(result) ? [] : (result?.stageErrors || []);

    res.json({
      success: true,
      recurringIssues,
      stageErrors,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    console.error('[recurring/analyze]', err.message);
    handleGeminiError(err, res);
  }
});



// ─── Get All Recurring Issues ─────────────────────────────────────────────────
app.get('/api/recurring', async (_req, res) => {
  try {
    const recurringIssues = await getAllRecurringIssues();
    res.json({ success: true, recurringIssues });
  } catch (err) {
    console.error('[recurring GET]', err.message);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// ─── Reset Organizational Memory ──────────────────────────────────────────────
app.delete('/api/recurring', async (_req, res) => {
  try {
    await resetMemory();
    res.json({ success: true, message: 'Organizational memory cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// ─── Shared Error Handler ─────────────────────────────────────────────────────
function handleGeminiError(err, res) {
  const status = err?.status || 500;
  const code = err?.code;

  if (code === 'UNAUTHORIZED' || err?.message?.includes('API_KEY_INVALID') || status === 400 || code === 'FORBIDDEN')
    return res.status(401).json({
      error: 'INVALID_API_KEY',
      message: 'The provided API key is invalid.',
    });

  if (code === 'RATE_LIMITED' || status === 429 || err?.message?.toLowerCase?.().includes('rate'))
    return res.status(429).json({
      error: 'QUOTA_EXCEEDED',
      message: 'API rate limit exceeded. Please retry shortly.',
    });

  if (code === 'INVALID_JSON' || code === 'INVALID_EMBEDDING' || status === 502)
    return res.status(502).json({
      error: code || 'UPSTREAM_INVALID_RESPONSE',
      message: err?.message || 'OpenRouter returned an invalid response.',
    });

  if (err instanceof SyntaxError)
    return res.status(502).json({
      error: 'INVALID_JSON_RESPONSE',
      message: 'OpenRouter returned an unparseable response.',
    });

  return res.status(status).json({
    error: 'INTERNAL_ERROR',
    message: err?.message || 'An unexpected error occurred.',
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[global_error]', err);
  const status = err?.status || 500;
  res.status(status).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: err?.message || 'Unexpected server error',
  });
});

// ─── Process-level guards (never terminate on API failures) ──────────────────
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});


// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🧠 OrgPulse AI  →  http://localhost:${PORT}`);
  console.log(`   /api/analyze              POST  — Stage 1: Extract`);
  console.log(`   /api/brief                POST  — Stage 2: Executive Brief`);
  console.log(`   /api/cypher               POST  — Stage 3: NL → Cypher`);
  console.log(`   /api/insight              POST  — Stage 4: Graph Insight`);
  console.log(`   /api/recurring/analyze    POST  — Stage 5: Recurring Issues`);
  console.log(`   /api/recurring            GET   — Org Memory`);
  console.log(`   /api/recurring            DELETE— Reset Memory`);
  console.log(`   /api/neo4j/run|ingest     POST  — Knowledge Graph`);
  console.log(`   AI Provider: ${process.env.GEMINI_API_KEY ? 'Gemini Direct ✓' : process.env.OPENROUTER_API_KEY ? 'OpenRouter ✓' : '✗ (use UI override)'}`);
  console.log(`   Neo4j:  ${process.env.NEO4J_URL || 'bolt://localhost:7687 (default)'}\n`);
});
