# Phase 2121 — Transitive Trace Summary

Static relative-import trace from the Laravel controller scanner and CLI controller invocation composition entry points:

- 416 reachable modules
- 1,973 resolved relative import edges
- 8 reachable modules under `packages/core/src/semantic/relations/`
- 1 reachable `relationFoundation.ts`
- 0 modules under a path segment exactly named `foundation`
- 20 reachable modules under `subscanners/`

This is not a claim of dependency-free architecture. `scanControllerAction` remains the action semantic implementation in production wiring. See `docs/traces/PHASE2121_CANONICAL_CONTROLLER_RESPONSE_ADT_TRACE.md` and rerun `npm run trace:phase2121-laravel-controller-transitive-imports` for the full list.
