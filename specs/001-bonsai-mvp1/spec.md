# Feature Specification: Bonsai MVP 1 — 1:1 copilot for leaders

**Feature Branch**: `001-bonsai-mvp1`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Bonsai MVP 1 — 1:1 copilot for leaders (see prompt-mvp-1on1.md.docx and the technical plan approved in conversation)"

Bonsai — continuous care, visible growth. A copilot that helps a leader prepare each 1:1, make sense of it afterwards, and keep continuity between meetings. The product interface is entirely in Brazilian Portuguese; code, data names and specs are in English.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage direct reports and their responsibilities map (Priority: P1)

The leader registers each direct report (name, role, start date with the leader, active/inactive) and uploads their "responsograma" (responsibilities map) as PDF, DOCX or text. Each upload becomes a new version; the latest version is the one used in analyses. The leader can delete a direct report, which removes that person and everything about them from the application (nothing about them is shown or used anywhere afterwards).

**Why this priority**: Everything else hangs off a registered person and their responsibilities map.

**Independent Test**: Create a person, upload two versions of a responsibilities map, see both versions listed with the latest marked current, then delete the person and confirm nothing about them is visible or used anywhere in the application.

**Acceptance Scenarios**:

1. **Given** no direct reports, **When** the leader registers one with all required fields, **Then** they appear in the list as active.
2. **Given** a person with one map, **When** the leader uploads a new file, **Then** version 2 is created, version 1 is kept in history, and version 2 is marked current.
3. **Given** a person with sessions, agreements and maps, **When** the leader confirms deletion, **Then** the person and all their data (maps, sessions, analyses, agreements, preparations) disappear from every list, timeline, overview and analysis input.
4. **Given** a scanned PDF with no readable text, **When** uploaded, **Then** the leader gets a clear message and no version is created.

---

### User Story 2 - Send a 1:1 transcript and review the AI analysis (Priority: P1)

After a meeting, the leader creates a 1:1 session (person, date) and provides the transcript by pasting text or sending a .txt, .vtt, .srt or .docx file. The leader asks for an analysis. Bonsai analyses the transcript together with the current responsibilities map, the final summaries of the last 3 reviewed meetings and the open agreements, and produces: summary, themes, new agreements (each with evidence from the transcript), suggested status for previous agreements, development signals tied to the responsibilities map, attention points, questions for the next 1:1 and private leader notes. The leader edits any field on a review screen and saves it as the final version. The leader can reprocess the same session with a different version of the analysis instructions and compare results.

**Why this priority**: This is the core value and the thing the MVP must validate.

**Independent Test**: Paste a fictional transcript, run the analysis, edit a field, save as final, and confirm the session shows as reviewed with the edited content.

**Acceptance Scenarios**:

1. **Given** a draft session with a transcript, **When** the leader asks for analysis, **Then** a result appears for review without blocking the screen while it runs.
2. **Given** an analysis result, **When** the leader edits the summary and saves, **Then** the session becomes "reviewed" and the edited version is the final one.
3. **Given** a transcript that never states a deadline for an agreement, **When** analysed, **Then** that agreement has no deadline.
4. **Given** the result is invalid after one automatic retry, **When** shown, **Then** the leader sees an error explaining it and can try again.
5. **Given** a reviewed session, **When** the leader reprocesses with another instruction version, **Then** the new result is a draft and the current final version stays until the new one is saved; both results can be compared side by side.

---

### User Story 3 - Track agreements and see development over time (Priority: P2)

Agreements found by the AI are saved automatically as soon as the analysis finishes, with no review needed, and stay open for the next 1:1 (the next analysis and the next preparation use them). They are editable items (description, owner: leader or direct report, deadline, status: open, done or cancelled) and the leader can also add one by hand. Until the leader edits or reviews an agreement it is marked as coming from the AI. The leader sees agreements per person and an overview across everyone, with overdue ones highlighted. Each person has a development timeline: meetings in chronological order, development signals per responsibility over time, and agreements fulfilled vs. not fulfilled.

**Why this priority**: Delivers the "continuity" and "visible growth" promise.

**Independent Test**: Review three sessions for one person and verify the timeline shows three meetings in order, with signals and agreement fulfilment.

**Acceptance Scenarios**:

1. **Given** a final review with 2 agreements, **When** saved, **Then** 2 agreements exist for that person with status open.
2. **Given** an open agreement with a past deadline, **When** listing, **Then** it is shown as overdue.
3. **Given** a reviewed session edited again, **When** saved, **Then** agreements are updated, not duplicated.
4. **Given** three reviewed sessions, **When** opening the timeline, **Then** they appear in date order with signals and agreement results.

---

### User Story 4 - Prepare the next 1:1 (Priority: P2)

On demand, for one direct report, Bonsai generates a preparation: open or overdue agreements, recurring or pending themes, 3 to 5 strategic questions (career, blockers, motivation, feedback to the leader, next challenges — not task status) and responsibilities-map points rarely discussed in recent meetings.

**Why this priority**: Closes the before-meeting moment of the 1:1 cycle.

**Independent Test**: After two reviewed sessions, generate the preparation and verify it mentions content from both.

**Acceptance Scenarios**:

1. **Given** two reviewed sessions and open agreements, **When** the leader asks for preparation, **Then** it lists those agreements and themes from those meetings.
2. **Given** a person with no history, **When** asking for preparation, **Then** it is based on the responsibilities map and says there is no history yet.

---

### User Story 5 - Share a summary with the direct report (Priority: P3)

The leader copies or exports in Markdown the reviewed summary and agreements. The export never contains the raw transcript or the leader's private notes.

**Why this priority**: Useful follow-up, depends on stories 2 and 3.

**Independent Test**: Export a session whose transcript and private notes contain unique marker text and confirm neither appears.

**Acceptance Scenarios**:

1. **Given** a reviewed session, **When** the leader exports, **Then** the file has summary, themes and agreements only.
2. **Given** an export, **When** done, **Then** the session records when it was exported.
3. **Given** a session not yet reviewed, **When** the leader tries to export, **Then** it is not offered.

### Edge Cases

- Transcript too long to be analysed: the leader sees a clear message; no partial result is saved.
- Analysis fails or the service is unavailable: session stays a draft and can be retried.
- Unsupported or corrupt file upload: rejected with a clear message.
- The previous-agreement status suggested by the analysis is only a suggestion until the leader saves the review.
- Direct report marked inactive: kept in history, hidden from default lists.
- Deleting a person while an analysis is running: the result is discarded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Leader MUST be able to create, edit, list, inactivate and delete direct reports (name, role, start date, status).
- **FR-002**: Deleting a direct report MUST remove them and all their data (maps, sessions, analyses, agreements, preparations) from everything the leader sees and from every analysis or preparation. The records are kept hidden (logical deletion); permanent destruction is part of the security phase.
- **FR-003**: Leader MUST be able to upload a responsibilities map as PDF, DOCX or text; each upload creates a new version, history is kept and the latest is used in analyses.
- **FR-003a**: The responsibilities map MUST also be fillable on screen in two sections, "Missão / finalidade do cargo" and "Responsabilidades", both at registration of the person (optional, becomes version 1) and later as new versions; the text used by the analysis is the two sections joined under those titles.
- **FR-004**: Leader MUST be able to create a 1:1 session with person, date and transcript (pasted, or from .txt, .vtt, .srt, .docx).
- **FR-005**: Leader MUST be able to request an AI analysis that uses the transcript, the current map, the final summaries of the last 3 reviewed meetings and open agreements.
- **FR-006**: The analysis MUST follow a fixed structure (summary, themes, new agreements with evidence, previous-agreement updates, development signals, attention points, next questions, private notes); an invalid result is retried once, then reported to the leader.
- **FR-007**: The analysis MUST use only what is in the transcript and history, MUST NOT invent facts, deadlines or agreements, and MUST NOT make psychological, health or personality judgments.
- **FR-008**: Every new agreement MUST include a transcript excerpt as evidence; unstated deadlines MUST be empty.
- **FR-008a**: The analysis MUST include a summary that is objective (at most about 5 short lines, no adjectives, safe to share) and a private feedback on the leader's conduct in that meeting (overall: went well / in part / can improve; strengths; opportunities with a concrete suggestion), based only on observable behaviours in the transcript. The leader feedback is only for the leader: it MUST NOT be shown to the direct report, appear in the timeline, or be included in the exported summary.
- **FR-009**: Leader MUST be able to edit every field of an analysis and save it as the final version of the session.
- **FR-010**: The instructions used for analysis MUST be versioned; each result MUST record which version and model produced it; the leader MUST be able to reprocess a session with another version and compare results.
- **FR-011**: Agreements found by the AI MUST be saved automatically when the analysis finishes and stay open for the next 1:1, without waiting for the review; they MUST be editable (description, owner, deadline, status), can be added by hand, are listed per person and in an overview, and overdue ones are identified. Reprocessing a session that has no final review replaces only its AI agreements that were not yet edited; once a review is saved, agreements follow the review, and reprocessing a reviewed session does not touch them until a new review is saved.
- **FR-011a**: Saving the transcript MUST start the analysis automatically (one action); the leader can still re-run it with another prompt version.
- **FR-012**: Each person MUST have a timeline with meetings in order, development signals over time and agreements fulfilled vs. not fulfilled.
- **FR-013**: Leader MUST be able to generate a preparation for the next 1:1 from history and the map (open/overdue agreements, recurring or pending themes, 3 to 5 strategic questions, under-discussed map points).
- **FR-014**: Leader MUST be able to copy or export in Markdown the reviewed summary and agreements, excluding raw transcript and private notes.
- **FR-015**: Application logs MUST NOT contain transcript or analysis content.
- **FR-016**: Every record MUST belong to a leader, and access to a person's data MUST go through a single place that decides who can see what, so that sign-in and per-leader isolation can be added later without rework. In this version there is one fixed leader and access is always allowed.
- **FR-017**: The interface MUST be in Brazilian Portuguese with short, direct button labels, calm and reading-first design, with the timeline as the visual centrepiece.

### Key Entities

- **Leader**: the single fixed user in this version; owns all data.
- **Direct report**: person led; name, role, start date, status.
- **Responsibilities map**: versioned document of a direct report; text used in analyses.
- **1:1 session**: a meeting; date, transcript, state (draft, analysed, reviewed), export date.
- **Analysis**: result produced for a session; instruction version, model, raw and reviewed content.
- **Agreement**: commitment from a session; description, owner, deadline, status, evidence.
- **Preparation**: generated briefing for the next meeting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the fictional test conversations, the analysis finds the expected agreements with zero invented agreements, deadlines or facts.
- **SC-002**: Preparation for the 2nd and 3rd meeting references content from earlier meetings in 100% of test cases.
- **SC-003**: At least 70% of analyses are accepted with few edits (leader-judged), measured over the test conversations.
- **SC-004**: From having a transcript to a reviewed summary takes under 10 minutes.
- **SC-005**: 100% of exports in tests contain neither the transcript nor private notes.
- **SC-006**: After deleting a direct report, 0 of their records appear in any screen, export, overview, analysis or preparation.

## Assumptions

- Business: one leader only; used with fictional test conversations, never real 1:1s (real use waits for the security phase, now planned as Phase 3: sign-in, encryption, audit, retention, LGPD consent). Out of scope: authentication, consent records, report access, multiple leaders, audio recording, calendar, mobile, development plans.
- Business: SC-003 "few edits" is judged by the leader; no automatic edit metric is required.
- Business: reprocessing a reviewed session creates a draft and keeps the final until a new review is saved.
- Business: status suggestions for previous agreements (done, cancelled, in progress) are suggestions until the leader saves the review; only new agreements are saved automatically.
- Business: the leader records the 1:1 outside Bonsai and sends the transcript (audio recording stays out of scope).
- Decision: stack is the golden path default (Node 22 + TypeScript + Prisma, PostgreSQL 16, React + Vite + Tailwind, Docker Compose). Why: constitution principle III.
- Decision: Anthropic API (Claude) for analysis and preparation, key via environment variable only; model name configurable and chosen later. Why: required by the prompt; model choice deferred by the user.
- Decision: code, tables and endpoints in English; UI text in Brazilian Portuguese. Why: user choice.
- Decision: deleting a direct report is a logical deletion (the person is hidden and everything that belongs to them stops being shown or used), following the golden path. Why: user choice. Consequence: the data still exists in the database until the security phase adds permanent destruction (retention and per-person key destruction); acceptable now because only fictional data is used.
- Decision: analysis runs in the background and the screen polls for the result. Why: analyses can take tens of seconds.
- Decision: UI design direction (paper-warm background, moss green, terracotta accent, serif reading typography, hand-drawn branch timeline) via the `frontend-design` skill, detailed in the plan. Why: calm, reading-first feel.
- Dependency: network access to the Anthropic API when running analyses; the `frontend-design` skill will be installed in the setup step with the user's approval (granted).
