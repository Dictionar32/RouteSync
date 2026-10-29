# Phase 2868 — Fully Typed Runtime Scanner Operations

## Scope

This phase continues the upstream CLI-manifest/runtime audit by migrating four remaining callable exports in `semanticDataflowKnowledge.ts` to named interface-first operation objects: `semanticAssignmentEffect.resolve`, `semanticAssignmentReference.resolve`, `semanticSource.create`, and `semanticDataFlowRole.resolve`. The semantic source factory call sites were migrated to `.create`; the semantic role lookup uses `.resolve`.

The existing upstream vocabulary and types are reused. No new CLI manifest composition authority or duplicate manifest wrapper was introduced. The canonical CLI path remains: scan/sync → manifest scan operation → CLI manifest scan factory → controller invocation manifest composition authority → upstream source binding/invocation judgment → `ControllerInvocationManifest.continueForDriftAudit(...)` → CLI projection.

## Actionable ADT

`SemanticPresence<T>` now retains its explicit `present` / `absent` variants and exposes `continueWith(handlers)` on both variants. `semanticPresenceOperations` is the interface-first runtime constructor authority; `semanticPresent` and `semanticAbsent` delegate to it. Consumers can exhaustively handle the semantic result rather than unpacking passive data or inventing a `reasoning` primitive. A focused test covers both branches.

## Validation

Run `npm run audit:phase2868-fully-typed-runtime-scanner-operations`. The audit checks 10 structural properties, including all four interface-first exports, actionable ADT continuation, migrated source factory call sites, absence of exported function declarations in the upstream knowledge module, and the empty `collections.ts` invariant.

The structural audit is not a substitute for a full TypeScript typecheck, test suite, build, or CLI end-to-end run; those are not claimed as passed in this phase.
