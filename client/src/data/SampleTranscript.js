/**
 * A realistic sample engineering team meeting transcript
 * for instant demo of OrgPulse AI.
 */
export const SAMPLE_TRANSCRIPT = `
[Meeting Recording — Phoenix Platform Quarterly Sync]
Date: Monday, June 9, 2026
Duration: ~52 minutes
Attendees: Sarah Chen (Engineering Lead), Marcus Webb (Backend), Priya Nair (Frontend),
           Daniel Okafor (DevOps), Ritika Sharma (Product), James Holloway (VP Engineering)

---

James Holloway: Alright everyone, let's get started. We've got a lot to cover today, mainly around Phoenix Platform and the Q3 release. Sarah, do you want to kick things off with the engineering status?

Sarah Chen: Sure. Overall Phoenix Platform is tracking okay but we have some serious blockers I want to flag early. Marcus, do you want to take the API piece first?

Marcus Webb: Yeah, so the authentication service refactor — we committed to having that wrapped up by June 20th, but we're now looking at a slip to June 27th. The problem is the Auth0 integration is taking longer than expected because their new SDK changed the token refresh flow and we need to re-test the full OAuth cycle. I'd call this HIGH priority.

Sarah Chen: That's a slip of an entire week. James, I want to escalate this to you — if the auth service isn't done by June 27th, we cannot start integration testing for the mobile app, which directly endangers the July 15th feature freeze. The mobile team is completely blocked on this.

James Holloway: Noted. Marcus, I need you to come back by this Friday — June 13th — with either a revised plan that brings this back to June 20th, or a clear risk mitigation if we're sticking with the 27th. This is CRITICAL.

Marcus Webb: Understood. I'll also need Priya's help — there are three API contract changes that affect the frontend. We need to do a joint contract review by Thursday.

Priya Nair: I can do Thursday. I'll also need to block off time with Marcus on Wednesday to go through the breaking changes in the user profile endpoints — those are going to require significant updates to our Redux state management. That's roughly two days of frontend work I hadn't accounted for.

Sarah Chen: Priya, can you capture that and give me a revised frontend timeline by end of day Wednesday, June 11th?

Priya Nair: Absolutely.

Ritika Sharma: Can I jump in here? On the product side, we've already communicated the July 15th feature freeze date to three enterprise customers — Acme Corp, Meridian Health, and Nexus Financial. If we miss that freeze, we're looking at a potential breach of our pilot agreement with Meridian Health. I think we need to treat this as a HIGH business risk.

James Holloway: Agreed. Ritika, please loop in our Customer Success VP — I believe that's Karen Yates — by tomorrow, June 10th. She needs to be aware of the risk to the Meridian Health pilot. This shouldn't come as a surprise to her if things slip.

Ritika Sharma: I'll email Karen today.

Daniel Okafor: I want to flag a separate infrastructure risk. We've been running the staging environment on the old Kubernetes cluster — version 1.26 — and EKS is dropping support for that at the end of June. If we don't upgrade to 1.29 before June 28th, we lose automated security patching and potentially break our SOC2 compliance posture. I need approval to schedule the upgrade window. I'm calling this CRITICAL because of the compliance implications.

James Holloway: That's definitely CRITICAL. Daniel, you have approval to plan the upgrade. Get me a maintenance window proposal by June 12th and coordinate with Marcus to make sure the auth service changes are compatible with 1.29 before we upgrade.

Daniel Okafor: Got it. I'll also need confirmation from the security team that our Vault configuration is compatible — I'll reach out to them separately.

Sarah Chen: Okay, moving on — we had an open question from last sprint about whether to adopt the new GraphQL federation layer for the reporting module. Ritika, where does product stand on this?

Ritika Sharma: We've been going back and forth, but I think we should defer that decision to the next sprint planning session on June 23rd. The reporting module isn't on the critical path for Q3, and adopting federation mid-release feels risky.

Sarah Chen: That makes sense. Let's defer. Marcus, can you put together a quick feasibility doc — just a page — by June 19th so we have something concrete to discuss at the June 23rd session?

Marcus Webb: Sure, I can do that.

James Holloway: One more thing before we wrap up. Priya, I saw the new dashboard UI mockups last week — they look excellent. I've decided we're going with Design Option B, the card-based layout, for the Q3 release. That's committed. I want the component library updated to reflect that by June 20th.

Priya Nair: Perfect, I'll start on that right after the contract review with Marcus this week.

Sarah Chen: Alright. To summarize the key commitments: Marcus is doing a recovery plan by June 13th, Priya gives me a revised timeline Wednesday, API contract review on Thursday, Daniel submits the K8s upgrade window proposal by June 12th, Ritika loops in Karen Yates today, and Marcus does the GraphQL feasibility doc by June 19th. Any questions? No? Great. Let's go.

[Meeting ended]
`.trim();

export const SAMPLE_MEETING_TITLE = 'Phoenix Platform Quarterly Sync';
export const SAMPLE_REFERENCE_DATE = '2026-06-09';
