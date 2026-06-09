/**
 * Recurring Issue Intelligence Prompt
 *
 * Receives a cluster of semantically-similar issues that appeared across
 * multiple meetings and produces an organizational intelligence brief.
 */

export const RECURRING_SYSTEM_PROMPT = `You are an Organizational Intelligence Analyst specializing in pattern detection across enterprise meetings.

You receive a cluster of related issues — risks or escalations — that have appeared across multiple separate meetings. Your job is to synthesize this cluster into a concise organizational intelligence brief for senior leadership.

Strict rules:
- Return ONLY the JSON object defined below.
- Do not use markdown or code fences.
- Base all analysis strictly on the provided cluster data.
- Do not invent facts, owners, or dates not present in the input.
- escalation_trajectory must be exactly one of: "IMPROVING" | "STABLE" | "WORSENING"
- combined_severity must be exactly one of: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
- current_status must be exactly one of: "OPEN" | "RESOLVED" | "PARTIALLY_RESOLVED"
- canonical_description: one sentence — the clearest, most complete description of the issue
- root_cause_hypothesis: one actionable sentence identifying the probable root cause
- recommended_action: specific, owner-named, and deadline-bound where possible (max 2 sentences)
- days_open: integer computed from first_seen to today
- affected_projects: array of project/area names (may be empty array)
- involved_owners: array of owner names (may be empty array)

Escalation trajectory logic:
- WORSENING: severity increased across meetings, or frequency increased, or still unresolved after 3+ occurrences
- IMPROVING: severity decreased, or status shows partial resolution
- STABLE: consistent severity with no clear trend`;

export const RECURRING_USER_TEMPLATE = `Cluster data:

{{CLUSTER_JSON}}

Related items across meetings:

{{ITEMS_JSON}}

Today's date: {{TODAY}}

Generate the organizational intelligence brief.

Output ONLY this JSON object:

{
  "cluster_id": "{{CLUSTER_ID}}",
  "occurrence_count": <integer>,
  "first_seen": "<YYYY-MM-DD>",
  "last_seen": "<YYYY-MM-DD>",
  "days_open": <integer>,
  "current_status": "<OPEN|RESOLVED|PARTIALLY_RESOLVED>",
  "canonical_description": "<single sentence>",
  "root_cause_hypothesis": "<single actionable sentence>",
  "escalation_trajectory": "<IMPROVING|STABLE|WORSENING>",
  "combined_severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
  "affected_projects": ["<project name>"],
  "involved_owners": ["<owner name>"],
  "recommended_action": "<specific action>"
}`;

/**
 * Build the recurring issue analysis prompt.
 *
 * @param {object} cluster     - The cluster object from chroma.service
 * @param {object[]} items     - Enriched related items (with full metadata)
 * @returns {{ system: string, user: string }}
 */
export function buildRecurringPrompt(cluster, items) {
  const today = new Date().toISOString().slice(0, 10);

  // Strip embeddings before sending to Gemini
  const safeItems = items.map(({ embedding, ...rest }) => rest);

  const user = RECURRING_USER_TEMPLATE
    .replace('{{CLUSTER_JSON}}',  JSON.stringify({
      cluster_id:       cluster.cluster_id,
      occurrence_count: cluster.occurrence_count,
      first_seen:       cluster.first_seen,
      last_seen:        cluster.last_seen,
    }, null, 2))
    .replace('{{ITEMS_JSON}}',    JSON.stringify(safeItems, null, 2))
    .replace('{{TODAY}}',         today)
    .replace('{{CLUSTER_ID}}',    cluster.cluster_id);

  return { system: RECURRING_SYSTEM_PROMPT, user };
}
