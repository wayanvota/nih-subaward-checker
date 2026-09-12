# NIH Subaward Checker end-to-end test report

## Scope

The Playwright harness runs the production Next.js application and real
multipart decision route. A local HTTP fixture replaces only OpenAI drafting.
The deterministic decision engine, form persistence, rule paths, audit trail,
upload validation, request limits, error boundary, and React rendering remain
active. No credential or public service is required in CI.

## Required categories

| ID | Category | Expected behavior |
| --- | --- | --- |
| U01 | Public boundary | Deterministic decision and narrow AI role render |
| U02 | Entry flow | Home page reaches the checker |
| U03 | Required path | Cited draft and audit trail are produced |
| U04 | Approved arrangement | Determination is not required, without a draft |
| U05 | Existing recipient | Existing-subrecipient route is not required |
| U06 | Non-subaward | Not-a-subaward route is not required |
| U07 | Foreign route | Workflow stops at PF5/UF5 |
| U08 | Unknown facts | Human review appears without a draft |
| U09 | Persistence | Entered values survive reload |
| U10 | Reset | Saved inputs and result are cleared |
| A01 | Wrong encoding | Non-form request receives bounded 400 |
| A02 | Request size | Oversized input is rejected before evaluation |
| A03 | File type | Non-PDF upload receives bounded 400 |
| A04 | Model independence | Non-required decision bypasses drafting failure |
| A05 | Model contradiction | Draft cannot alter deterministic determination |
| A06 | Active HTML | Draft text remains inert |
| A07 | Provider failure | Manual rule route remains usable |
| A08 | Route abuse | Unknown route and method fail closed |
| A09 | Invalid choices | Unexpected values route to human review |
| A10 | Error disclosure | Failure omits secrets/stacks and sets headers |

## Verification record

Status: local gate and GitHub Actions run 34665235628 passed on 2026-09-11.

- Existing deterministic rule tests: 4 passed.
- Next.js 16.3.3 production build: passed on Node 22.16.0.
- End-to-end suite: 20 of 20 passed, covering U01-U10 and A01-A10.
- Dependency audit: 0 vulnerabilities after applying the existing signed
  Dependabot update. The previous lockfile reported 5 vulnerabilities, including
  1 critical and 3 high findings.
- Authorized live-provider smoke: one explicitly synthetic required-path case
  returned `REQUIRED`, preserved the synthetic grant and organization fields in
  the draft, and recorded the deterministic rule path. No user or grant data was
  sent.

The harness added bounded multipart and PDF limits, defensive response headers,
and public error messages that omit provider details. It also verifies that a
non-required decision bypasses a failed drafting service and that model text
cannot alter the deterministic determination.

```bash
npm ci
npx playwright install chromium
npm run test:ci
npm audit --audit-level=high
```

The deterministic fixture uses a fake local API key. Any authorized live OpenAI
smoke remains separate from the required CI gate, and no real key is persisted.
