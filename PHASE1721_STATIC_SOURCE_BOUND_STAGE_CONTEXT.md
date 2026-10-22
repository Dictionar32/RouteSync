# Phase 1721 — Static Source-Bound Stage Context

## Scope

This phase strengthens the upstream static invocation interface contract. It does not implement static invocation algebra or authority validation and does not change production Laravel scanner wiring.

## Trace finding

The previous algebra stage inputs independently carried `knowledge` and `subject`. Although the contract required them to remain correlated, each stage could structurally receive a separately assembled pair. That left the model weaker than its stated source-snapshot invariant.

## Interface correction

- Added `InvocationStaticResolvedSourceContext`, carrying one `SemanticKnowledgeDataFlow` snapshot and the uniquely matched `SemanticStaticInvocation`.
- Changed subject-presence success to return the context as one typed result.
- Changed positional evidence, target resolution, argument binding, effect projection, and judgment assembly inputs to consume the same context.
- Changed the derived algebra envelope to carry `sourceContext` and `judgment` together.
- Kept authority input restricted to the derived envelope, so it cannot be paired with independent knowledge or subject fields.
- Strengthened the Laravel scanner boundary contract to require forwarding the same source-bound context between upstream stages.
- Exported the context type from `packages/core/src/index.ts`.

## Contract versions

- Static invocation algebra: 4
- Authority validation and receipt: 7
- Aggregate static judgment: 11
- Static judgment model: 17
- Invocation semantic coverage: 17
- Invocation pipeline: 30
- Laravel controller scanner boundary: 9

## Verification scope

The Phase 1721 audit checks the source-bound stage input/output shapes and public export. Historical audit scripts from Phase 1702 onward were refreshed to assert current contract versions and stage shapes; the Phase 1721 audit is the direct check for this change.

No claim is made that type-level bundling alone proves runtime object identity or source provenance. The eventual algebra and authority implementations must enforce those semantic invariants. Full package build was not run. Production scanner wiring remains unchanged.

## Audit results

- Phase 1721 direct audit: **17/17 PASS**.
- Regression range Phase 1702–1721: **301/301 PASS across 20 audit scripts**.
- Targeted strict TypeScript check: exit code 2 because of 88 lines of diagnostics in unrelated domain/resource-model modules; zero diagnostics referenced `invocationSemanticPipelineInterface.ts` or `laravelControllerScannerInterface.ts`.
- Full package build was not run.

See `PHASE1721_AUDIT.json` and `PHASE1721_REGRESSION_AUDIT.json` for machine-readable results.
