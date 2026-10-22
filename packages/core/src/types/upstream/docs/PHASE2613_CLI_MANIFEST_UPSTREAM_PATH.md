# RouteSync Phase 2613 — CLI → Manifest → Upstream Path Closure

## Scope

Continue from the Phase 2606 workspace. The priority is path correctness and ownership before full runtime/build closure: the CLI composition root must assemble the canonical upstream semantic pipeline once, and `scan` / `sync` must consume that exact assembled pipeline without re-resolving semantic authority.

## Root causes addressed

1. `scan.ts` and `sync.ts` called `requestTypeDerivationSemanticPipelineResolution.resolve(...)` after the CLI composition root had already passed the supplied capabilities through `assembleRequestTypeDerivationProductionPipeline`. This introduced a second semantic-resolution gate inside command execution. The commands now consume `composition.requestTypeDerivationPipeline` directly and fail closed if the composition is absent.
2. `audit-phase2579-authority-integrity-closed-adt.cjs` pointed at a nonexistent `types/upstream/requestTypeDerivationAssessmentIntegrityRuntime.ts`. The real implementation is `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAssessmentIntegrity.ts`; the audit now checks that actual owner instead of failing on a stale path.

## Path after change

```text
Host-provided canonical semantic capabilities
  → standalone composition loader (canonical contract + capability shape)
  → createProgramFromSemanticComposition
  → core assembleRequestTypeDerivationProductionPipeline
  → CLI composition { manifest authority, exact assembled pipeline }
  → scan / sync consume that pipeline
  → manifest authority canonicalizes project identity
  → source discovery + source-document identity binding
  → source-bound invocation pipeline + upstream judgment authority
  → inventory completeness/correspondence authority
  → manifest builder receives validated receipt
  → request/resource resolution preflight
  → semantic projection
  → manifest output
```

The diagram describes the code path and ownership boundaries, not proof that a production host producer/verifier or real Laravel end-to-end run is present.

## Ownership and constraints

- Existing `RequestTypeDerivationSemanticPipelineCompositionInterface` and `RequestTypeDerivationSourceEvidenceInventoryInterface` remain canonical; no duplicate contract was added.
- Identity and inventory operations remain implemented under `packages/core/src/compiler/semantic/request-type-derivation/` and typed by the upstream contract.
- CLI manifest composition remains responsible for discovery and wiring; semantic classification and inventory closure remain core authority responsibilities.
- No `RequestType[]` fallback was introduced.
- No `semantic/foundation` or `semantic/relation` imports were added.

## Validation limits

The new audit performs structural assertions and TypeScript syntax transpilation only. It is not a substitute for full `tsc`, Vitest, package build, or a real Laravel project scan. The host-provided production reasoning and independent complete verifier remain an explicit integration prerequisite unless separately implemented and proven.

## Executed checks

- Phase 2613 CLI/manifest/upstream path audit: 14/14 structural and syntax assertions passed.
- Phase 2605 CLI manifest/upstream trace: 11/11 passed.
- Phase 2605 host composition loader: 10/10 passed.
- Phase 2600 manifest preflight public contract: 6/6 passed.
- Phase 2601 request-type law obligation closure: 8/8 passed.
- Phase 2599 upstream inventory operation export: 6/6 passed.
- Phase 2579 authority integrity closed ADT: 13/13 passed after correcting its stale source path.
- `package.json` JSON parse passed.

`node_modules` is absent in the supplied workspace archive. Full TypeScript typecheck, Vitest, package build, and end-to-end execution against a real Laravel project were not run.
