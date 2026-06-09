/**
 * @typedef {Object} Meeting
 * @property {string} title
 * @property {string} date
 * @property {number} duration_minutes
 * @property {Array<{name:string, role:string, team?:string}>} participants
 * @property {string} primary_project
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} owner
 * @property {string} priority
 * @property {string} deadline
 * @property {string} status
 */

/**
 * @typedef {Object} Risk
 * @property {string} id
 * @property {string} description
 * @property {string} severity
 * @property {string} probability
 * @property {string} impact_area
 * @property {string} trigger
 * @property {string} mitigation
 */

/**
 * @typedef {Object} Escalation
 * @property {string} id
 * @property {string} description
 * @property {string} severity
 * @property {boolean} is_blocker
 * @property {string} raised_by
 * @property {string} escalated_to
 * @property {string} project
 */

/**
 * @typedef {Object} Brief
 * @property {string} org_health
 * @property {number} health_score
 * @property {string} leadership_summary
 * @property {Array<{rank:number, description:string, severity:string, probability:string, impact_area:string, owner:string}>} top_risks
 * @property {Array<{description:string, severity:string, affected_project:string}>} top_blockers
 * @property {Array<{name:string, reason:string, project_health_score:number, health:string, open_tasks:number, open_escalations:number, open_risks:number}>} critical_projects
 * @property {Array<{name:string, open_task_count:number, tasks:string[]}>} overloaded_owners
 * @property {Array<{title:string, priority:string, project:string}>} unassigned_tasks
 * @property {Array<{priority:number, action:string, rationale:string}>} recommended_actions
 * @property {number} meeting_intelligence_score
 */

export default {};
