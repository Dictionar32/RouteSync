# Phase 953 — Upstream/Downstream Ownership and Source→Sink Proof

## Ownership repair

Generic relation substrate is owned by `semantic/foundation`:

- `relationMembership.ts`
- `relationalSequence.ts`
- `semanticRelations.ts`

Scanner consumers now import these modules directly from `semantic/foundation`; the compatibility `semantic/kernel` facade is no longer an ownership dependency of scanner code.

`semanticDecisionRewriteEngine` is intentionally not moved in this phase because no equivalent generic foundation owner was established; it remains a separate semantic decision subsystem.

## Canonical upstream boundary

Production `types/upstream` has no imports back into compiler/scanner/domain/passes/IR. Tests are not used as production ownership evidence.

## Dataflow source→sink

`scanner semantic evidence → SemanticDataflowInput → astDataflowAuthority → SemanticDataflowJudgment → semanticDataflowInterfaceFromJudgment → AstAnalysisInterface → SSA/downstream consumers`.

`reaches` is derived by the authority rather than accepted as an input fact.

## Laravel policy source→sink

`Laravel route/controller evidence → EffectiveControllerActionPolicy → canonical policy relations → CompleteLaravelSourceModel → structural relation filter → GraphEdgeRelation`.

Policy relations remain semantic relations and are excluded from structural graph projection.

## Ecommerce provenance

The historical `examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` trees remain absent. The maintained corpus is `packages/sdk/tests/fixtures/ecommerce-shop-source`.

The fixture is consumed by SDK producer tests. The core Phase-760 dataflow regression uses inline source strings with the fixture path as provenance metadata; this is deliberately not reported as physical fixture execution.
