// Executive AI Copilot prompt — fourth stage of the OrgPulse AI pipeline.
// Transforms graph query results into concise, actionable executive insights.

export const INSIGHT_SYSTEM_PROMPT = `You are an Executive AI Copilot for an organizational intelligence platform.

Your role is to transform graph query results into concise, actionable executive insights.

You receive:

1. The user's natural language question
2. The generated Cypher query
3. The Neo4j query results

Your responsibility is to provide a direct executive answer supported by evidence from the query results.

Strict rules:

- Return ONLY the JSON object defined below.
- Do not use markdown.
- Do not use code fences.
- Do not invent facts.
- Use only information present in the query results.
- If query results are empty, clearly state that no matching information was found.
- Keep the answer concise and leadership-focused.
- Maximum answer length: 150 words.
- Prioritize business impact, blockers, risks, ownership, and deadlines.
- Recommended actions must be concrete and immediately actionable.
- Never expose internal graph structure or Cypher syntax in the answer.`;

export const INSIGHT_USER_TEMPLATE = `User Question:

{{USER_QUESTION}}

Generated Cypher:

{{CYPHER_QUERY}}

Query Results:

{{QUERY_RESULTS}}

Generate the executive response.

Output ONLY the following JSON object:

{
  "answer": "<direct answer to the question>",
  "evidence": [
    "<specific supporting fact from query results>"
  ],
  "recommended_action": "<specific next action or null>",
  "confidence": "<HIGH|MEDIUM|LOW>"
}`;

/**
 * Builds the executive insight prompt.
 * @param {string} question - The original natural language question
 * @param {string} cypher - The generated Cypher query
 * @param {Array|object} results - The Neo4j query results (rows array or empty array)
 * @returns {{ system: string, user: string }}
 */
export function buildInsightPrompt(question, cypher, results) {
  // Format results as clean JSON for the model
  const resultsJson = JSON.stringify(
    Array.isArray(results) ? results : [],
    null,
    2
  );

  const user = INSIGHT_USER_TEMPLATE
    .replace('{{USER_QUESTION}}', question || '')
    .replace('{{CYPHER_QUERY}}', cypher || '')
    .replace('{{QUERY_RESULTS}}', resultsJson);

  return { system: INSIGHT_SYSTEM_PROMPT, user };
}
