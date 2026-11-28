# 2Chat Community Standards and Moderator Enforcement Rules

Version: 1.0  
Status: Proposed for the current single-admin operating model

## 1. Purpose and scope

These rules govern reports submitted by 2Chat users and the decisions made by the sole authorized administrator. They apply to profiles, Posts, Shorts, private messages, and group messages. A report is an allegation, not proof of a violation.

## 2. Core moderation principles

1. Review the reported material and available context before deciding.
2. Apply the same written standards to all users.
3. Do not punish a user solely because a report was submitted or because several users coordinated reports.
4. Use the least restrictive effective action.
5. Record a clear, factual reason for every decision.
6. Protect reporter identity and private information; disclose only what is necessary.
7. Do not retaliate against good-faith reporters, even when a report is not substantiated.
8. Do not inspect unrelated private conversations. Access message content only where the report and applicable safety/legal process justify it.
9. Keep moderation records secure and restrict access to the authorized administrator.
10. A moderator must not moderate their own account. Reports concerning the administrator require an independent escalation path outside the ordinary dashboard.

## 3. Report priority

### Critical safety
- Child sexual abuse material (CSAM)
- Grooming or sexual exploitation of a minor
- Sexualization of minors
- Credible, imminent threats of serious physical harm

These reports require immediate triage and escalation through the applicable child-safety, emergency, and legal reporting procedures. Do not download, copy, redistribute, or create additional copies of suspected CSAM for review. Do not treat the ordinary report queue as a substitute for legally required escalation.

### High priority
- Threats that are not clearly imminent
- Targeted harassment, stalking, or repeated abusive conduct
- Sexual exploitation or severe abuse involving adults

### Standard priority
- Spam, scams, impersonation, and other alleged policy violations

Priority determines review urgency, not whether the accused user is guilty.

## 4. Enforcement actions

### A. No violation / dismiss
Use when the available evidence does not establish a policy violation, the report is mistaken, or the content is outside the policy scope. Record why it is dismissed. A good-faith unsuccessful report is not itself misconduct.

### B. Mark reviewed
Use only to record that the report has been examined but no final decision has been made. It must not be used to imply guilt or close a safety escalation.

### C. Warning
Use for a substantiated, lower-severity or first-time violation where education is likely to prevent recurrence. Tell the user which rule was breached and what behavior must stop.

### D. Content removal
Remove a Post or Short when the material itself violates these rules. Record the exact policy basis. Do not remove unrelated content as punishment. The current implementation supports report-based removal of Posts and Shorts; private-message and group-message removal requires a separate, specifically designed workflow.

### E. Temporary suspension
Use for serious violations, repeated violations after warning, or where a temporary restriction is needed to prevent further harm. The current dashboard permits 1–365 days. Record why the duration is proportionate.

### F. Permanent suspension
Reserve for severe violations, repeated serious violations, or a substantiated continuing risk that cannot reasonably be addressed by a lesser action. Require strong evidence, a specific policy basis, and a written explanation. Because 2Chat currently has one administrator, that administrator is the only account authorized to apply this action. This single-person arrangement is an operational limitation, not independent oversight; maintain an external escalation route for cases involving the administrator or conflicts of interest.

## 5. Required investigation checklist

Before saving any decision, the administrator must confirm:

- The reported content or account was correctly identified.
- Available evidence and relevant context were reviewed.
- The conduct was matched to a specific 2Chat rule.
- Immediate safety risks were assessed.
- The chosen action is proportionate to severity, intent, impact, and recurrence.
- A clear decision reason is recorded.

The checklist is a procedural safeguard; checking boxes does not replace evidence.

## 6. Decision record

For every report decision, retain:
- Report ID and reported content/account reference
- Reporting reason and user-provided description
- Decision and moderation action
- Administrator ID
- Decision timestamp
- Written reason
- Suspension end date, where applicable
- Relevant action history

Do not expose reporter identity in notices to the reported user unless disclosure is legally required.

## 7. User notice and appeals

When an action is taken, the affected user should receive a notice identifying the rule, action, duration (if temporary), and how to appeal. A report dismissal should not reveal unnecessary information about the reporter. An appeal should be reviewed by a person who did not make the original decision where reasonably possible. Since the current service has one administrator, appeals involving that administrator need an external review route before the appeal feature is represented as independent.

## 8. Restrictions and implementation boundaries

- Admin dashboard access must remain protected by server-side role checks.
- A client-side role label or hidden button is not authorization.
- The administrator account itself cannot be suspended through the ordinary user-report action.
- Reports involving private messages or group messages must not trigger automatic message deletion under this implementation.
- Suspected child sexual exploitation material must follow the applicable specialist escalation process; do not preserve or circulate illegal material as evidence.
- Keep financial/accounting records according to applicable retention obligations; moderation actions must not be used to erase those records.
- Review these rules and legal obligations before launch in every country where 2Chat operates.

## 9. Current implementation note

The report dashboard currently supports: mark reviewed, dismiss, warn user, remove reported Post/Short, temporary suspension (1–365 days), and permanent suspension. The investigation checklist and decision reason are required by the server. Private-message/group-message content removal, user appeals, user-facing moderation notices, evidence attachments, and external child-safety escalation integrations are not implemented by this change and must not be described as available until separately built and tested.
