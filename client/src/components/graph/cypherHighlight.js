/**
 * Syntax-highlights a Cypher query string with colored HTML spans.
 * Returns an HTML string safe for dangerouslySetInnerHTML.
 */
export function highlightCypher(query) {
  if (!query) return '';

  // Escape HTML entities first
  const escaped = query
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Apply syntax classes in order (specific → general)
  return escaped
    // Keywords
    .replace(
      /\b(MATCH|OPTIONAL\s+MATCH|WHERE|WITH|RETURN|ORDER\s+BY|LIMIT|SKIP|AS|AND|OR|NOT|IN|CONTAINS|STARTS\s+WITH|ENDS\s+WITH|DISTINCT|COUNT|COLLECT|SUM|AVG|MIN|MAX|toLower|toUpper|size|length|type|id|labels|keys|nodes|relationships|EXISTS|CASE|WHEN|THEN|ELSE|END|DESC|ASC|UNWIND|FOREACH|IS\s+NULL|IS\s+NOT\s+NULL)\b/gi,
      '<span class="cy-keyword">$1</span>'
    )
    // Node labels (:Label)
    .replace(/(:)([A-Z][A-Za-z0-9]*)/g, '<span class="cy-colon">$1</span><span class="cy-label">$2</span>')
    // Relationship types [:TYPE]
    .replace(/\[:([A-Z_]+)\]/g, '[<span class="cy-rel">:$1</span>]')
    // String literals
    .replace(/'([^']*)'/g, "<span class=\"cy-string\">'$1'</span>")
    // Numbers
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="cy-number">$1</span>')
    // Variables (lowercase identifiers)
    .replace(/\b([a-z][a-zA-Z0-9_]*)\b(?!\s*[:(])/g, '<span class="cy-var">$1</span>')
    // Property access (dot notation)
    .replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '.<span class="cy-prop">$1</span>');
}

/**
 * Suggested sample questions for the graph query console.
 */
export const SAMPLE_QUESTIONS = [
  'What are the unresolved escalations?',
  'Which projects are at risk?',
  'Who owns the most pending tasks?',
  'Show all CRITICAL risks',
  'Which tasks have no assigned owner?',
  'What decisions were committed in this meeting?',
  'Show all blockers',
  'Which tasks are overdue?',
];
