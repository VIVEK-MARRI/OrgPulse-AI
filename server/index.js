import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPrompt } from './prompt.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '4mb' }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
  ],
  methods: ['GET', 'POST'],
}));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// ─── Analyze Endpoint ─────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const {
    transcript,
    meetingTitle,
    referenceDate,
    apiKeyOverride,
  } = req.body;

  // Validate required fields
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    return res.status(400).json({
      error: 'MISSING_TRANSCRIPT',
      message: 'The "transcript" field is required and must be a non-empty string.',
    });
  }

  // Resolve API key: override takes precedence over env var
  const apiKey = (apiKeyOverride && apiKeyOverride.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(401).json({
      error: 'MISSING_API_KEY',
      message: 'No Gemini API key found. Set GEMINI_API_KEY in your .env file or provide it in the request.',
    });
  }

  // Build prompt
  const today = referenceDate || new Date().toISOString().slice(0, 10);
  const { system, user } = buildPrompt(transcript.trim(), meetingTitle, today);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: system,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,        // Low temperature for deterministic structured output
        topP: 0.8,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent(user);
    const text = result.response.text();

    // Parse and validate the JSON response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('[OrgPulse] JSON parse error. Raw response:\n', text);
      return res.status(502).json({
        error: 'INVALID_JSON_RESPONSE',
        message: 'Gemini returned an unparseable response. Please try again.',
        raw: text.slice(0, 500),
      });
    }

    // Validate top-level shape
    const requiredKeys = ['meeting', 'tasks', 'escalations', 'risks', 'decisions', 'stakeholders', 'dependencies'];
    const missingKeys = requiredKeys.filter(k => !(k in parsed));
    if (missingKeys.length > 0) {
      return res.status(502).json({
        error: 'INCOMPLETE_RESPONSE',
        message: `Gemini response is missing required keys: ${missingKeys.join(', ')}`,
        partial: parsed,
      });
    }

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('[OrgPulse] Gemini API error:', err.message);

    // Surface specific Gemini errors cleanly
    if (err.message?.includes('API_KEY_INVALID') || err.status === 400) {
      return res.status(401).json({
        error: 'INVALID_API_KEY',
        message: 'The provided Gemini API key is invalid.',
      });
    }
    if (err.message?.includes('quota') || err.status === 429) {
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        message: 'Gemini API quota exceeded. Please wait and try again.',
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred.',
    });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🧠 OrgPulse AI server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Gemini key:   ${process.env.GEMINI_API_KEY ? '✓ configured' : '✗ not set (use UI override)'}\n`);
});
