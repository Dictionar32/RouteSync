# Phase 1506 — Existing Interface Authority: Full-Text Predicate Cutover

## Architectural decision

This phase evolves the existing `QueryProducerSemanticInterface` and its `resolveQueryOperation` dispatcher. It introduces no parallel interface and no scanner-side semantic authority.

## Trace and change

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`: adds `query_full_text_condition_rule` to the existing closed rule identity union.
- `packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts`: adds a descriptor catalog for `whereFullText` and `orWhereFullText`; validates field and search-value evidence; creates the final `full_text` condition and junction operation; returns resolved/malformed decisions through the existing dispatcher.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`: removes its local full-text predicate handler. The existing upstream dispatcher is consulted before the legacy migration frontier.
- `packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts`: tests resolved OR full-text and malformed missing search value.
- `scripts/audits/audit-phase1506-existing-interface-full-text-authority.cjs`: checks contract ownership, dispatcher registration, scanner cutover, tests, and report.

## Model improvement

The scanner no longer infers full-text junction semantics from method names. Source spelling is mapped to a closed semantic descriptor upstream, and argument evidence is validated before the operation is constructed. A recognized but incomplete method yields a rule-carrying `malformed` judgment, preventing it from being silently reclassified by the scanner's compatibility fallback.

## Verification boundary

The phase audit and TypeScript transpilation syntax checks are run for the modified sources. They do not replace the full build, typecheck, or Vitest suite, which require project-pinned dependencies.

## Remaining boundary

Other scanner-owned families remain in `queryNamedMethodOperationCatalog`, including raw predicates, row-value predicates, JSON and vector predicates, relation predicates/aggregates, ordering/grouping, and execution configuration. The scanner still has a legacy fallback for unclaimed operation families. Full interface-first completion requires migrating these families through the same existing contract, then moving consumers to `operationJudgments` before removing `operations` compatibility projections.
