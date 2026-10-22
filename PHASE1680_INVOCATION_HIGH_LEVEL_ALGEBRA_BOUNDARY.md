# Phase 1680 — Invocation High-Level Algebra Boundary

## Intent

Correct the interface design without migrating wiring. The invocation algebra boundary is now expressed as one high-level domain operation instead of exposing target resolution, argument binding, effect projection, and closure as caller-driven low-level interface methods.

## Changes

- Added `InvocationSemanticAlgebraBoundaryInterface` with one `derive(InvocationSemanticInput): InvocationSemanticJudgment` operation.
- Added a domain contract for source evidence ownership, target resolution outcomes, evidence-backed argument binding, result/exception projection, proof/trace correlation, closure, partial judgments, and semantic identity correlation.
- Exported the high-level algebra boundary from the upstream barrel and package public index.
- Removed the low-level staged algebra interface and stage-input types from the package public index. The old staged implementation contract remains internal as a migration source; it has not been wired to the new boundary in this phase.
- Did not modify algebra implementation, authority, executor, scanner, or downstream wiring.

## Verification

- Phase 1680 audit: 13/13 passed.
- Focused TypeScript strict check of the new interface: passed.
- ZIP integrity: passed; archive root is `RouteSync/`.
- Full repository build and end-to-end behavior: not run/not claimed. The new high-level boundary is a contract-first target; implementation migration is intentionally deferred until the remaining interfaces are audited and settled.
