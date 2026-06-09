class GeminiRequestError extends Error {
  constructor({ status, code, details, message }) {
    super(message);
    this.name = 'GeminiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isRetryableStatus(status) { return status === 429 || (status >= 500 && status <= 599); }

async function fetchWithTimeout(url, options, { timeoutMs = 30000 } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(id); }
}

async function requestWithRetry(url, init, { retries = 4, timeoutMs = 30000, retryBaseMs = 500, retryJitterMs = 250 } = {}) {
  const fetchFn = () => fetchWithTimeout(url, { ...init }, { timeoutMs });
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchFn();
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        const err = new GeminiRequestError({ status: res.status, code: res.status === 429 ? 'RATE_LIMITED' : (res.status === 403 ? 'FORBIDDEN' : undefined), details: errorText, message: `Gemini API error: ${res.status} ${errorText}` });
        if (isRetryableStatus(res.status) && attempt < retries) { await sleep(retryBaseMs * Math.pow(2, attempt) + (Math.random() * retryJitterMs)); continue; }
        throw err;
      }
      return res;
    } catch (err) {
      lastErr = err;
      const s = err?.status;
      if (attempt < retries && (s === 429 || (s >= 500 && s <= 599) || err?.name === 'AbortError')) { await sleep(retryBaseMs * Math.pow(2, attempt) + (Math.random() * retryJitterMs)); continue; }
      throw err;
    }
  }
  throw lastErr;
}

function safeParseJson(text) {
  try { return { ok: true, value: JSON.parse(text) }; }
  catch (e) { return { ok: false, error: e }; }
}

function stripModelPrefix(m) { return m.replace(/^google\//, ''); }

function isGeminiKey(key) { return key && (key.startsWith('AIza') || key.startsWith('AQ.')); }

export async function callGemini(apiKey, system, user, { json = true, model: modelName = 'google/gemini-2.0-flash-lite', maxTokens = 8192 } = {}) {
  if (isGeminiKey(apiKey)) {
    return await callGeminiDirect(apiKey, system, user, { json, model: stripModelPrefix(modelName), maxTokens });
  }
  return await callOpenRouter(apiKey, system, user, { json, model: modelName, maxTokens });
}

async function callGeminiDirect(apiKey, system, user, { json, model, maxTokens }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.1,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (system) {
    body.systemInstruction = { role: 'user', parts: [{ text: system }] };
  }
  const response = await requestWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  if (!text) {
    const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason || 'EMPTY_RESPONSE';
    throw new GeminiRequestError({ status: 502, code: reason, details: data, message: `Gemini returned empty response (${reason})` });
  }

  if (json) {
    const clean = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = safeParseJson(clean);
    if (parsed.ok) return parsed.value;
    throw new GeminiRequestError({ code: 'INVALID_JSON', status: 502, details: { rawText: text.slice(0, 2000) }, message: 'Gemini returned invalid JSON' });
  }
  return text;
}

async function callOpenRouter(apiKey, system, user, { json, model, maxTokens }) {
  const response = await requestWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'OrgPulse AI' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: maxTokens, temperature: 0.1, ...(json ? { response_format: { type: 'json_object' } } : {}) }),
  });
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content.trim() : '';
  if (!json) return text;
  const parsed = safeParseJson(text);
  if (parsed.ok) return parsed.value;
  throw new GeminiRequestError({ code: 'INVALID_JSON', status: 502, details: { rawText: text.slice(0, 2000) }, message: 'OpenRouter returned invalid JSON' });
}

export async function getEmbedding(text, apiKey) {
  if (isGeminiKey(apiKey)) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const response = await requestWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
    });
    const data = await response.json();
    const embedding = data?.embedding?.values;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new GeminiRequestError({ code: 'INVALID_EMBEDDING', status: 502, details: data, message: 'Gemini returned invalid embedding' });
    }
    return embedding;
  }

  const response = await requestWithRetry('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  const data = await response.json();
  const embedding = data.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new GeminiRequestError({ code: 'INVALID_EMBEDDING', status: 502, details: data, message: 'OpenRouter returned invalid embedding' });
  }
  return embedding;
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i]; }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
