# UX-flow review — checklist, severity rubric, report template

## Evaluation checklist (run per flow)

### Click & step economy
- [ ] Count user actions from intent → outcome; is it at the minimum?
- [ ] Any step removable, deferrable, or default-able (pre-filled, remembered)?
- [ ] Any re-auth, re-entry of known data, or redundant confirmation?

### Clarity & confusion
- [ ] Exactly one **primary** action per screen; secondary actions visually subordinate?
- [ ] Is the next step unmistakable without reading carefully?
- [ ] Any jargon leaking to the user (tokens, entitlement, UID, WHEP, slug)?
- [ ] Decision overload (too many choices/CTAs at once)?
- [ ] Labels match user intent ("Start the Challenge", not "Create checkout session")?

### Dead-ends & recovery
- [ ] Every CTA target route exists (no dead links)?
- [ ] Every denial (401/403/not-enrolled/expired/lapsed) routes to recovery, not `/` or blank?
- [ ] Missing states? (loading / empty / error / **denied** / success)
- [ ] Async gaps handled (e.g. webhook-grant delay shows "finalizing", not "forbidden")?

### Activation & engagement
- [ ] Time-to-value: how fast from purchase/signup → first play? Minimized?
- [ ] Is "today's / next" action surfaced, not buried in a list/grid?
- [ ] Progress / momentum visible where it drives return visits?
- [ ] Upsell/next-step offered at the peak-motivation moment?

### Trust & tone (audience: women 30+, beginners/returners)
- [ ] Warm, low-pressure, confidence-building copy; no intimidation cues?
- [ ] Honest outcomes + required disclaimers near health claims?
- [ ] Social proof (ratings/reviews) placed at the decision point?
- [ ] Mobile-first: thumb-reachable CTAs, no hover-only affordances?
- [ ] Lowest-friction auth (magic link); no forced social account?

## Severity rubric (by funnel-metric impact)
- **Critical** — blocks a purchase/activation or creates a dead-end on the money path (e.g. cold buyer can't create an account; paid buyer sees "forbidden"). Fix before launch.
- **High** — adds avoidable steps/confusion that measurably depresses conversion or retention (e.g. bare grid hides Day 1; upsell mistimed).
- **Medium** — friction that annoys but rarely blocks (extra tap, weak label, missing empty state).
- **Low** — polish (copy warmth, spacing, micro-affordances).

Tie each finding to a metric: **conversion** (landing→buy), **activation** (buy→Day 1), **retention** (membership month-3), or **trust**.

## Findings-report template

```markdown
# UX-flow review — <flow name> (<doc-mode | implementation-mode | reconciled>)

## Clicks to key outcome
| Outcome | Current | Proposed |
|---|---|---|
| <intent → outcome> | N | M |

## Findings (prioritized)
### [Critical] <title>
- Where: <doc § / route / file:line>
- Friction: <+1 click | dead-end | jargon | confusing label | missing state>
- Impact: <conversion | activation | retention | trust>
- Fix: <concrete change>
- Effort: <S/M/L>

### [High] <title>
...

## Summary
<2–3 lines: the biggest wins and the single highest-leverage fix.>
```

## Optional: write findings back as requirements
When asked, append confirmed items to `WEB_PRODUCT_REQUIREMENTS.md` (or the relevant spec) as `UX-FR-<n>` entries with acceptance criteria, so flow fixes enter the build backlog alongside functional requirements.
