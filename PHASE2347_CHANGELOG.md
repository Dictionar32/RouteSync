# Phase 2347 — Policy Blocker Execution Order

- Moved the existing route scanner invocation directly after successful controller scanning.
- Route-source and effective-controller-policy blockers now return before resource, response, service, middleware, provider, channel, and complete source-AST projection work.
- Kept the existing upstream route scanner and source-AST projection ADTs; no parallel interface or semantic authority introduced.
- Static audit passed 14/14. Type-check, Vitest, CLI end-to-end, and build remain unverified; `npm run build` was not run.
