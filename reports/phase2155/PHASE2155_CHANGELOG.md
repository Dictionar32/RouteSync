# Phase 2155 Changelog

- Removed the legacy `resolveRequest(...)` classifier from `controllerActionContract.ts`.
- Reused the existing upstream request-binding authority as the single owner of request kind and PHP type resolution.
- Passed the same closed request judgment into the action projection and published action semantic judgment.
- Unified `ControllerActionContract.request` with the canonical request ADT.
- Preserved typed and unresolved request outcomes in route projection.
- Bumped action semantic judgment contract version from 18 to 19.
- Added static audit and trace documentation.
- Did not run full build, full typecheck, or Vitest.
