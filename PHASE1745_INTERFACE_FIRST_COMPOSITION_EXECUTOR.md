# Phase 1745 — Interface-first integrated-response composition executor

## Trace finding

The upstream model already had typed inventory, ordinary invocation analysis, publication result ADTs, and an integrate-only public composition interface. It did not have a composition executor. The Laravel scanner still called `invocationSemanticPipeline.analyzeKnowledge(...)` directly. The inventory and publication-authority interfaces also have no production implementations in this source snapshot.

## Changes

- Added `InvocationSemanticIntegratedResponseCompositionDependencies`, a typed upstream dependency contract joining the existing inventory, pipeline, and publication authorities without exposing those dependencies to scanner consumers.
- Implemented `createInvocationSemanticIntegratedResponseComposition` in the upstream pipeline module. It runs inventory and analysis against the exact same `SemanticKnowledgeDataFlow` object, submits both to the existing publication authority, projects the typed validated/rejected publication result into the integrated-response ADT, and returns the exact knowledge reference beside that response.
- Kept the public composition interface integrate-only; the scanner boundary explicitly forbids direct component-authority access.
- Bumped composition contract to v4, invocation pipeline contract to v54, and Laravel invocation boundary to v33.
- Kept production Laravel scanner wiring unchanged because inventory and publication-authority implementations remain absent. The contract does not claim the end-to-end path is wired.
- No dependency on `core/src/semantic/foundation` was added.

## Verification

Run `node scripts/audits/audit-phase1745-composition-executor-interface-first.cjs` or `npm run audit:phase1745-composition-executor-interface-first`.

The audit is structural/static. A package build or TypeScript typecheck was not run in this environment. Runtime behavior and identity preservation still need executable tests once concrete inventory/publication implementations are available.
