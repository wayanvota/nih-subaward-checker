# NIH Subaward Prior-Approval Checker

Single-page MVP for grants-office decision support under NIH notice NOT-OD-26-062.

## What It Does

- Determines whether a proposed post-award subaward change requires NIH prior approval.
- Routes foreign subawards out of scope to the PF5/UF5 path.
- Drafts an eRA Commons Prior Approval Module `Other Request` only when the deterministic rule engine returns `REQUIRED`.
- Records an audit trail with inputs, rule path, timestamp, and citation.

The tool is decision support only. A grants officer reviews the output and submits any request in eRA Commons. The app never claims to be an official NIH determination and never submits to NIH.

## Rule

Prior approval is required when all four facts are true:

- The proposed change is a subaward.
- The subrecipient is new to the project.
- The arrangement was not part of the peer-reviewed and approved application.
- The subaward is domestic.

Foreign subawards are outside the MVP and route to the PF5/UF5 path.

## AI Boundary

The model may extract approved subrecipients and budget notes from an uploaded PDF and draft a justification narrative. It never decides the determination.

## Local Run

```bash
npm install
npm run dev
```

Set `OPENAI_API_KEY` in `.env.local`.

## Checks

```bash
npm test
npm run build
```

## Deploy

Deploy to Render as a Node web service and add `OPENAI_API_KEY` as a project environment variable.

Recommended Render settings:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables: `OPENAI_API_KEY`, and optionally `NODE_VERSION=22`
