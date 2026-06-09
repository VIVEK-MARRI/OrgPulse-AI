// Cypher query generator prompt — third stage of the OrgPulse AI pipeline.
// Converts natural language questions into read-only Neo4j Cypher queries.

export const CYPHER_SYSTEM_PROMPT = `You are a Neo4j Cypher query generator for an organizational intelligence knowledge graph.

Your sole function is to convert natural language questions about organizational data into valid, executable Cypher queries.

GRAPH SCHEMA — memorize this exactly.

Node labels and properties:

Meeting     { id: string, title: string, date: string, primary_project: string }

Person      { name: string, team: string }

Task        {
  id: string,
  title: string,
  deadline: string,
  priority: string,
  status: string,
  project: string
}

Risk        {
  id: string,
  description: string,
  trigger: string,
  impact_area: string,
  probability: string,
  severity: string,
  risk_score: float
}

Escalation  {
  id: string,
  description: string,
  severity: string,
  status: string,
  is_blocker: boolean
}

Decision    {
  id: string,
  description: string,
  type: string
}

Project     { name: string }

Team        { name: string }

Dependency  {
  id: string,
  description: string,
  type: string
}

Relationships (direction matters):

(Meeting)-[:CONTAINS]->(Task)
(Meeting)-[:CONTAINS]->(Decision)
(Meeting)-[:CONTAINS]->(Escalation)
(Meeting)-[:CONTAINS]->(Risk)

(Person)-[:ASSIGNED_TO]->(Task)
(Person)-[:RAISED]->(Escalation)
(Person)-[:PARTICIPATED_IN]->(Meeting)

(Task)-[:BLOCKED_BY]->(Risk)
(Task)-[:DEPENDS_ON]->(Dependency)

(Risk)-[:IMPACTS]->(Project)

(Escalation)-[:RELATED_TO]->(Risk)

(Team)-[:OWNS]->(Project)
(Team)-[:INVOLVED_IN]->(Meeting)

Strict Rules:

* Return ONLY the Cypher query.
* No explanation.
* No markdown.
* No code fences.
* No comments.
* No semicolons.

Security Rules:

* Never generate CREATE.
* Never generate MERGE.
* Never generate DELETE.
* Never generate SET.
* Never generate REMOVE.
* Never generate DROP.
* Never generate CALL.
* Never generate LOAD CSV.
* Never generate any write operation.
* Generate read-only MATCH / WHERE / WITH / RETURN queries only.

Query Rules:

* All string comparisons must be case-insensitive.

Use:

toLower(property) CONTAINS toLower('value')

* For open or unresolved items:

status = 'OPEN'

* For high-priority tasks:

priority IN ['HIGH','CRITICAL']

* For high-severity risks/escalations:

severity IN ['HIGH','CRITICAL']

* Always include LIMIT 20 unless:
  * the question requests a count
  * the question requests an aggregate
  * the question explicitly requests all records

* Use DISTINCT whenever joins may create duplicate rows.

* Return only human-readable fields.

Never return:
* nodes
* relationships
* graph objects

Risk Ordering Rules:

If risk_score exists:
ORDER BY r.risk_score DESC

Otherwise:
ORDER BY r.severity DESC

Why Question Rules:

When a question asks "Why is <project> at risk?" use:
(Task)-[:BLOCKED_BY]->(Risk)
(Escalation)-[:RELATED_TO]->(Risk)
(Risk)-[:IMPACTS]->(Project)
to generate explanatory results.

Fallback Rule:

If the question cannot be mapped to the schema with high confidence, return exactly:
MATCH (n)
RETURN 'Unsupported question' AS message
LIMIT 1

Common Question Patterns:

"What are the unresolved escalations?"
→ MATCH (e:Escalation) WHERE e.status = 'OPEN' RETURN ...

"Which projects are at risk?"
→ MATCH (r:Risk)-[:IMPACTS]->(p:Project) WHERE r.severity IN ['HIGH','CRITICAL'] RETURN ...

"Who owns the most pending tasks?"
→ MATCH (p:Person)-[:ASSIGNED_TO]->(t:Task) WHERE t.status = 'OPEN' RETURN p.name, count(t) AS task_count ORDER BY task_count DESC LIMIT 10

"Show all tasks assigned to Rahul"
→ MATCH (p:Person)-[:ASSIGNED_TO]->(t:Task) WHERE toLower(p.name) CONTAINS toLower('Rahul') RETURN ...

"Which meetings discussed Vendor API?"
→ MATCH (m:Meeting)-[:CONTAINS]->(e:Escalation) WHERE toLower(e.description) CONTAINS toLower('Vendor API') RETURN ...

"Why is Payment Integration at risk?"
→ MATCH (r:Risk)-[:IMPACTS]->(p:Project) WHERE toLower(p.name) CONTAINS toLower('Payment Integration') MATCH (t:Task)-[:BLOCKED_BY]->(r) MATCH (e:Escalation)-[:RELATED_TO]->(r) RETURN ...

"What changed since the previous meeting?"
→ MATCH (m:Meeting) WITH m ORDER BY m.date DESC LIMIT 2 WITH collect(m) AS meetings MATCH (latest:Meeting)-[:CONTAINS]->(item) WHERE latest.id = meetings[0].id RETURN ...`;

export const CYPHER_USER_TEMPLATE = `Question:

{{USER_QUESTION}}

Generate the Cypher query.

Output only the query and nothing else.`;

/**
 * Builds the Cypher generation prompt.
 * @param {string} question - The natural language question
 * @returns {{ system: string, user: string }}
 */
export function buildCypherPrompt(question) {
  const user = CYPHER_USER_TEMPLATE.replace('{{USER_QUESTION}}', question);
  return { system: CYPHER_SYSTEM_PROMPT, user };
}

// ── Neo4j Ingest Cypher Builder ────────────────────────────────────────────
// Converts OrgPulse extraction JSON into a series of MERGE/CREATE Cypher statements
// for populating the knowledge graph.

/**
 * Generates an array of Cypher write statements to ingest a full extraction.
 * @param {object} data - The structured extraction from /api/analyze
 * @param {string} meetingId - Unique meeting ID
 * @returns {string[]} Array of Cypher statement strings
 */
export function buildIngestStatements(data, meetingId) {
  const statements = [];
  const { meeting, tasks, escalations, risks, decisions, stakeholders, dependencies } = data;

  // ── Meeting node ──
  statements.push(
    `MERGE (m:Meeting {id: ${JSON.stringify(meetingId)}})
SET m.title = ${JSON.stringify(meeting.title || '')},
    m.date = ${JSON.stringify(meeting.date || '')},
    m.primary_project = ${JSON.stringify(meeting.primary_project || '')}`
  );

  // ── Primary project node ──
  if (meeting.primary_project) {
    statements.push(
      `MERGE (proj:Project {name: ${JSON.stringify(meeting.primary_project)}})`
    );
  }

  // ── Participants → Person nodes → PARTICIPATED_IN ──
  for (const name of (meeting.participants || [])) {
    const stake = stakeholders?.find(s => s.name === name);
    statements.push(
      `MERGE (p:Person {name: ${JSON.stringify(name)}})
SET p.team = ${JSON.stringify(stake?.team || '')}
WITH p
MATCH (m:Meeting {id: ${JSON.stringify(meetingId)}})
MERGE (p)-[:PARTICIPATED_IN]->(m)`
    );
  }

  // ── Tasks ──
  for (const task of (tasks || [])) {
    statements.push(
      `MERGE (t:Task {id: ${JSON.stringify(meetingId + '_' + task.id)}})
SET t.title = ${JSON.stringify(task.title || '')},
    t.deadline = ${JSON.stringify(task.deadline || '')},
    t.priority = ${JSON.stringify(task.priority || '')},
    t.status = ${JSON.stringify(task.status || 'OPEN')},
    t.project = ${JSON.stringify(task.project || '')}
WITH t
MATCH (m:Meeting {id: ${JSON.stringify(meetingId)}})
MERGE (m)-[:CONTAINS]->(t)`
    );
    if (task.owner) {
      statements.push(
        `MATCH (p:Person {name: ${JSON.stringify(task.owner)}})
MATCH (t:Task {id: ${JSON.stringify(meetingId + '_' + task.id)}})
MERGE (p)-[:ASSIGNED_TO]->(t)`
      );
    }
    if (task.project) {
      statements.push(
        `MERGE (proj:Project {name: ${JSON.stringify(task.project)}})
WITH proj
MATCH (t:Task {id: ${JSON.stringify(meetingId + '_' + task.id)}})
MERGE (t)-[:BELONGS_TO]->(proj)`
      );
    }
  }

  // ── Risks ──
  for (const risk of (risks || [])) {
    const riskScore = (
      ({ CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[risk.severity] || 0) *
      ({ HIGH: 3, MEDIUM: 2, LOW: 1 }[risk.probability] || 0)
    );
    statements.push(
      `MERGE (r:Risk {id: ${JSON.stringify(meetingId + '_' + risk.id)}})
SET r.description = ${JSON.stringify(risk.description || '')},
    r.trigger = ${JSON.stringify(risk.trigger || '')},
    r.impact_area = ${JSON.stringify(risk.impact_area || '')},
    r.probability = ${JSON.stringify(risk.probability || '')},
    r.severity = ${JSON.stringify(risk.severity || '')},
    r.risk_score = ${riskScore}
WITH r
MATCH (m:Meeting {id: ${JSON.stringify(meetingId)}})
MERGE (m)-[:CONTAINS]->(r)`
    );
    if (risk.impact_area) {
      statements.push(
        `MERGE (proj:Project {name: ${JSON.stringify(risk.impact_area)}})
WITH proj
MATCH (r:Risk {id: ${JSON.stringify(meetingId + '_' + risk.id)}})
MERGE (r)-[:IMPACTS]->(proj)`
      );
    }
  }

  // ── Escalations ──
  for (const esc of (escalations || [])) {
    statements.push(
      `MERGE (e:Escalation {id: ${JSON.stringify(meetingId + '_' + esc.id)}})
SET e.description = ${JSON.stringify(esc.description || '')},
    e.severity = ${JSON.stringify(esc.severity || '')},
    e.status = ${JSON.stringify(esc.status || 'OPEN')},
    e.is_blocker = ${esc.is_blocker ? 'true' : 'false'}
WITH e
MATCH (m:Meeting {id: ${JSON.stringify(meetingId)}})
MERGE (m)-[:CONTAINS]->(e)`
    );
    if (esc.raised_by) {
      statements.push(
        `MATCH (p:Person {name: ${JSON.stringify(esc.raised_by)}})
MATCH (e:Escalation {id: ${JSON.stringify(meetingId + '_' + esc.id)}})
MERGE (p)-[:RAISED]->(e)`
      );
    }
  }

  // ── Decisions ──
  for (const dec of (decisions || [])) {
    statements.push(
      `MERGE (d:Decision {id: ${JSON.stringify(meetingId + '_' + dec.id)}})
SET d.description = ${JSON.stringify(dec.description || '')},
    d.type = ${JSON.stringify(dec.type || '')}
WITH d
MATCH (m:Meeting {id: ${JSON.stringify(meetingId)}})
MERGE (m)-[:CONTAINS]->(d)`
    );
  }

  // ── Dependencies ──
  for (const dep of (dependencies || [])) {
    statements.push(
      `MERGE (dep:Dependency {id: ${JSON.stringify(meetingId + '_' + dep.id)}})
SET dep.description = ${JSON.stringify(dep.description || '')},
    dep.type = ${JSON.stringify(dep.type || '')}`
    );
  }

  return statements;
}
