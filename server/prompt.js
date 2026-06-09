// System prompt template for OrgPulse AI meeting intelligence extraction
// Tokens: {{REFERENCE_DATE}}, {{MEETING_TITLE}}, {{TRANSCRIPT}}

export const SYSTEM_PROMPT = `You are a structured information extraction engine for an enterprise meeting intelligence platform.
Your sole responsibility is to analyze meeting transcripts and produce a single, complete, machine-readable JSON object.

You operate under the following strict rules:
- You NEVER produce narrative text, preamble, explanation, or any content outside the JSON object.
- You NEVER use markdown formatting, code fences, or backticks.
- You NEVER invent, infer, or hallucinate people, projects, dates, or decisions that are not explicitly stated or clearly implied in the transcript.
- If a field cannot be determined from the transcript, you set it to null. You never guess.
- Every string value is clean, trimmed, and in sentence case unless it is a proper noun.
- All dates must be in ISO 8601 format (YYYY-MM-DD). Relative expressions like "Friday" or "next week" must be converted using the reference date provided. If no reference date is provided and a relative date cannot be resolved, set to null.
- Priority and severity fields accept only these exact values: "CRITICAL", "HIGH", "MEDIUM", "LOW". No other values are valid.
- Status fields for tasks default to "OPEN". Status fields for escalations default to "OPEN".
- Arrays must never be null. If there are no items, return an empty array [].
- The top-level JSON object must contain exactly the keys defined below. No additional keys.`;

export const USER_PROMPT_TEMPLATE = `Reference date: {{REFERENCE_DATE}}
Meeting title: {{MEETING_TITLE}}

TRANSCRIPT:
{{TRANSCRIPT}}

Extract all organizational intelligence from the transcript above and return a single JSON object with this exact structure. Do not output anything other than this JSON object.

{
  "meeting": {
    "title": "<string — use provided title or infer from content, never null>",
    "date": "<ISO 8601 date or null>",
    "duration_minutes": <integer or null>,
    "participants": ["<name>"],
    "primary_project": "<string or null — the main project under discussion>"
  },
  "tasks": [
    {
      "id": "<string — format: T001, T002, ...>",
      "title": "<concise action phrase starting with a verb, e.g. 'Coordinate API contract review with backend team'>",
      "owner": "<full name exactly as mentioned in transcript, or null if unassigned>",
      "deadline": "<ISO 8601 date or null>",
      "priority": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "project": "<project name or null>",
      "status": "OPEN",
      "source_quote": "<exact short phrase from transcript that produced this task, max 120 characters>"
    }
  ],
  "escalations": [
    {
      "id": "<string — format: E001, E002, ...>",
      "description": "<clear, specific statement of what was escalated — who, what, why>",
      "raised_by": "<full name or null>",
      "escalated_to": "<person, team, or level (e.g. 'VP of Engineering') or null>",
      "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "is_blocker": <true|false>,
      "related_project": "<project name or null>",
      "status": "OPEN",
      "source_quote": "<exact short phrase from transcript, max 120 characters>"
    }
  ],
  "risks": [
    {
      "id": "<string — format: R001, R002, ...>",
      "description": "<specific risk statement — what might happen and why>",
      "trigger": "<the specific condition or issue causing this risk>",
      "impact_area": "<what project, milestone, or process is at risk>",
      "probability": "<HIGH|MEDIUM|LOW>",
      "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "mitigation_mentioned": "<mitigation if explicitly discussed, else null>",
      "source_quote": "<exact short phrase from transcript, max 120 characters>"
    }
  ],
  "decisions": [
    {
      "id": "<string — format: D001, D002, ...>",
      "description": "<specific statement of what was decided or committed to>",
      "type": "<COMMITTED|DEFERRED|OPEN_QUESTION>",
      "made_by": "<full name or null>",
      "rationale": "<reason stated in meeting, or null>",
      "source_quote": "<exact short phrase from transcript, max 120 characters>"
    }
  ],
  "stakeholders": [
    {
      "name": "<full name exactly as mentioned>",
      "team": "<team name or null>",
      "role_in_meeting": "<e.g. 'escalation owner', 'task assignee', 'decision maker', 'observer'>"
    }
  ],
  "dependencies": [
    {
      "id": "<string — format: DEP001, DEP002, ...>",
      "description": "<what depends on what>",
      "from_entity": "<task id, project name, or team name>",
      "to_entity": "<the dependency — person, team, system, or external vendor>",
      "type": "<BLOCKS|REQUIRES|WAITING_ON>"
    }
  ]
}`;

/**
 * Builds the final prompt by substituting template tokens.
 * @param {string} transcript - The raw meeting transcript text
 * @param {string} meetingTitle - The meeting title (may be empty/null)
 * @param {string} referenceDate - ISO 8601 reference date string
 * @returns {{ system: string, user: string }}
 */
export function buildPrompt(transcript, meetingTitle, referenceDate) {
  const user = USER_PROMPT_TEMPLATE
    .replace('{{REFERENCE_DATE}}', referenceDate || 'Not provided')
    .replace('{{MEETING_TITLE}}', meetingTitle || 'Not provided')
    .replace('{{TRANSCRIPT}}', transcript);

  return { system: SYSTEM_PROMPT, user };
}
