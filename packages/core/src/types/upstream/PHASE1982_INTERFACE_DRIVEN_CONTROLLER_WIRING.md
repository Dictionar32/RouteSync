# Phase 1982 — Interface-driven controller wiring

## Decision

Wiring is also modeled as an interface before changing its runtime implementation. The new `LaravelControllerInvocationResponseWiringInterface` describes the invocation-to-response edge as a compile-time contract over the canonical `LaravelControllerScanArtifact`.

## Contract

- `artifact` is the canonical carrier of both `invocationJudgment` and `responseJudgment`.
- The invocation projection is indexed from `Artifact['invocationJudgment']`.
- The response projection is indexed from `Artifact['responseJudgment']` and the invocation subtype admitted by the artifact.
- The contract explicitly preserves distinct `not_connected`, `source_binding_rejected`, `blocked`, and `complete` outcomes.
- The interface adds no `wire`, `connect`, `analyze`, or other callable reasoning method. It is a declarative wiring contract, not a second authority or runtime factory.

## Trace finding

The existing runtime file `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still constructs `LaravelControllerScanArtifact` without `responseJudgment`, while the Phase 1981 interface requires that field. It also still imports `semantic/relations` and legacy controller subscanners. This is a concrete migration gap, not a completed runtime migration.

This phase deliberately changes only upstream declarations, type exports, the retirement contract's reference to the wiring interface, and an audit. It does not patch runtime wiring before the interface contract is established.

## Verification boundary

Run `node scripts/audits/audit-phase1982-interface-driven-controller-wiring.cjs` from the repository root. This is a structural audit only. TypeScript typecheck/build has not been run, and the existing runtime is expected to need a later implementation migration to satisfy the newer controller artifact contract.
