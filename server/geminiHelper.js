/**
 * Shared Gemini helper used by all OrgPulse AI pipeline stages.
 * Extracted from index.js so server services can import it without circular deps.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Call Gemini and return either parsed JSON or raw text.
 *
 * @param {string} apiKey
 * @param {string} system - System instruction
 * @param {string} user   - User prompt
 * @param {{ json?: boolean, model?: string, maxTokens?: number }} [opts]
 * @returns {Promise<object|string>}
 */
export async function callGemini(
  apiKey,
  system,
  user,
  { json = true, model: modelName = 'gemini-2.0-flash', maxTokens = 8192 } = {}
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: system,
    generationConfig: {
      ...(json ? { responseMimeType: 'application/json' } : {}),
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: maxTokens,
    },
  });
  const result = await model.generateContent(user);
  const text = result.response.text().trim();
  if (!json) return text;
  return JSON.parse(text);
}

/**
 * Generate a text embedding using Gemini text-embedding-004 (768 dims).
 *
 * @param {string} text
 * @param {string} apiKey
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Cosine similarity between two equal-length float vectors.
 * Returns value in [-1, 1].
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
