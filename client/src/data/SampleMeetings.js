/**
 * Demo Series — three meetings that demonstrate Organizational Memory.
 * Analyzing A → B → C in sequence will cluster the Vendor API issue
 * across meetings and trigger the recurring risk alert.
 */

export const DEMO_MEETINGS = [
  {
    id: 'A',
    label: 'Meeting A — May 20',
    title: 'Payment Integration Sprint Review — May 20',
    referenceDate: '2026-05-20',
    transcript: `[Meeting Recording — Payment Integration Sprint Review]
Date: Monday, May 20, 2026
Duration: ~40 minutes
Attendees: Rahul Mehta (Backend Lead), Ananya Singh (Product), Vikram Rao (Engineering Manager), Priya Desai (Frontend)

---

Vikram Rao: Let's kick off the sprint review. Rahul, how did the payment integration sprint go?

Rahul Mehta: Honestly, it was a tough week. We hit a major blocker — the Vendor API has been completely unstable. We're seeing error rates of over 30% on transaction calls, and it's directly causing Payment Integration to fall behind schedule.

Ananya Singh: How serious is this? Are we going to miss the milestone?

Rahul Mehta: Yes, at this rate we will. The Vendor API instability is causing the entire payment flow to fail intermittently. I've raised a ticket with the vendor but haven't heard back.

Vikram Rao: This is a serious risk. Let's log this as a critical risk. Rahul, I'm assigning you to follow up with the vendor by Wednesday, May 22nd.

Rahul Mehta: Understood. I'll escalate directly to their engineering team.

Ananya Singh: We should also notify the stakeholders about the potential delay on Payment Integration.

Vikram Rao: Agreed. Priya, can you prepare a status update for the client by Friday?

Priya Desai: Sure, I'll have it ready.

Vikram Rao: Final decision — we are delaying the Payment Integration milestone by one week pending vendor resolution. Rahul owns the vendor follow-up.

---

[Action Items]
- Rahul to escalate Vendor API instability to vendor engineering team — deadline May 22
- Priya to prepare client status update — deadline May 23
- Vikram to review risk if not resolved by May 24
`,
  },
  {
    id: 'B',
    label: 'Meeting B — May 27',
    title: 'Payment Integration Status Check — May 27',
    referenceDate: '2026-05-27',
    transcript: `[Meeting Recording — Payment Integration Status Check]
Date: Tuesday, May 27, 2026
Duration: ~30 minutes
Attendees: Rahul Mehta (Backend Lead), Vikram Rao (Engineering Manager), Ananya Singh (Product), Sonia Kumar (CTO)

---

Sonia Kumar: I've been pulled into this because the Payment Integration delay is now affecting Q2 targets. Rahul, what is the current status of the Vendor API issue?

Rahul Mehta: Unfortunately, the Vendor API issue is still unresolved. We escalated to their engineering team but the error rate has only dropped slightly — from 30% to 22%. The backend is still blocked. We can't process transactions reliably.

Sonia Kumar: This is completely unacceptable. Has the vendor committed to any resolution date?

Rahul Mehta: They've said they're "working on it" but gave no firm date. I've been following up daily.

Vikram Rao: The Vendor API issue is now our single biggest blocker. The entire Payment Integration timeline is at risk. We have a client demo in three weeks.

Ananya Singh: We need to escalate this further. Can we bring in our account manager at the vendor?

Sonia Kumar: Yes. Rahul, I want you to loop in our account manager AND get me on the next call with their VP of Engineering. This escalation needs to go to the top.

Rahul Mehta: I'll set that up by tomorrow.

Vikram Rao: Decision: we are formally escalating the Vendor API issue to executive level. Sonia will personally engage the vendor VP.

Sonia Kumar: If we don't have resolution by June 3rd, we need to evaluate alternative vendors.

---

[Action Items]
- Rahul to arrange vendor VP call — deadline May 28
- Sonia to join escalation call with vendor
- Vikram to prepare alternative vendor assessment — deadline June 1
`,
  },
  {
    id: 'C',
    label: 'Meeting C — June 3',
    title: 'Payment Integration Emergency Review — June 3',
    referenceDate: '2026-06-03',
    transcript: `[Meeting Recording — Payment Integration Emergency Review]
Date: Tuesday, June 3, 2026
Duration: ~45 minutes
Attendees: Rahul Mehta (Backend Lead), Sonia Kumar (CTO), Vikram Rao (Engineering Manager), Ananya Singh (Product), Legal Counsel (James)

---

Sonia Kumar: This is now an emergency meeting. We've been dealing with the Vendor API reliability problem for over two weeks and Payment Integration is still delayed because of it.

Rahul Mehta: The vendor VP call happened but we still have no committed resolution date. The Vendor API error rate is now back up to 28% — it actually got worse over the weekend. Payment Integration is completely blocked.

James (Legal): From a contract perspective, the vendor is in breach of their SLA, which guarantees 99.5% uptime. We're seeing 72% uptime across the last two weeks.

Sonia Kumar: This is a critical organizational risk. I want to document that Payment Integration has been delayed due to Vendor API reliability failures for 14 days.

Vikram Rao: Our client demo is in 7 days. We cannot show a broken payment flow. We need an immediate decision.

Ananya Singh: Realistically, we have two options: mock the payment API for the demo, or delay the demo.

Sonia Kumar: Decisions: First, we will formally issue a notice of breach to the vendor today. Second, we will begin parallel evaluation of alternative payment API vendors. Third, the client demo is postponed by two weeks to June 17th.

Rahul Mehta: I'll start evaluating Stripe and Braintree as alternatives.

Vikram Rao: This recurring Vendor API issue has now caused a cascading impact on our entire Q2 roadmap.

---

[Action Items]
- James to send breach notice to vendor — deadline June 3 (today)
- Rahul to evaluate Stripe and Braintree — deadline June 6
- Sonia to notify client of demo postponement — deadline June 4
- Vikram to update Q2 roadmap — deadline June 5
`,
  },
];
