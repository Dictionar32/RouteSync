# Phase 1514 — Interface-Owned Query Semantic Model

## Objective

Strengthen the existing upstream semantic interface as the public authority for query-operation rule ownership. This phase intentionally changes the interface/model boundary first; it does not introduce a parallel semantic interface or move work into scanner wiring.

## Trace and change

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`
  - `QueryProducerSemanticInterface` now exposes `queryOperationRules`, an immutable typed view of the declared rule model.
  - The contract exposes declarations only; evaluator callbacks remain private implementation details.
- `packages/core/src/types/upstream/queryProducerSemanticReasoning.ts`
  - Publishes `queryOperationSemanticRules` from the existing declared rule bindings.
  - Catalog validation and method-dispatch indexing consume the same declaration projection, reducing the chance that the public model and dispatch authority diverge.
  - The existing `queryProducerSemanticReasoning` implementation exposes the same model through `QueryProducerSemanticInterface`.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`
  - The scanner continues to submit evidence to `queryProducerSemanticAlgebra.resolveQueryOperation`; it does not need to import or interpret the private evaluator catalog.
  - The separate legacy catalog remains a migration frontier for unclaimed families and is not deleted prematurely.
- `packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts`
  - Added a regression test that the public interface exposes the authoritative rule declarations.
- `packages/core/src/index.ts` and `package.json`
  - Export the public rule model/type and add the Phase 1514 source audit command.

## Architecture status

The boundary is now clearer:

`typed source evidence → interface-owned rule model → upstream semantic judgment → scanner projection`

This is a real interface/model improvement, but **it does not yet prove that runtime execution is executor-only**. Existing rule-specific functions still validate argument shapes and construct ASTs. The next semantic-model milestone must encode executable premises/constraints and derivation evidence in the algebra, then make evaluators consume those closed obligations rather than independently own semantic decisions. Do not claim that migration complete until per-family parity tests demonstrate it.

## Verification

- Phase 1513 audit: PASS.
- Phase 1514 source audit: see `PHASE1514_AUDIT.json`.
- Full TypeScript build and Vitest remain unverified unless run in an environment with this repository's pinned dependencies.
