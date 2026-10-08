# Phase 1241 — Upstream Interface Algebra / Wiring Trace

Active audit remains `scripts/audit/routesync-architecture.cjs`. `scripts/audits/` remains historical evidence and is not the active lane.

## Canonical boundary

```text
Laravel evidence
  -> upstream semantic reasoning algebra
  -> proof / derivation / provenance / closure
  -> semantic capability/dataflow contract
  -> closed authority
  -> UpstreamWiringInterface
  -> manifest / graph / IR / CLI projection
```

## Findings

- `SemanticReasoningInterface` is the execution algebra; `SemanticReasoningContractInterface` is the proof-carrying closed result; `SemanticReasoningAuthorityInterface` is the read-only boundary facet.
- `SemanticCapabilityAlgebraInterface -> SemanticCapabilityContractInterface -> SemanticCapabilityContract` owns route capability meaning upstream.
- `SemanticDataflowAlgebraInterface -> SemanticDataflowContractInterface -> SemanticDataflowInterface` owns closed dataflow judgment; generic `DataFlowInterface` remains execution/projection infrastructure.
- `DataFlowProjectionInterface` consumes authority through `UpstreamWiringInterface` rather than becoming a semantic solver.
- Manifest dataflow is seed transport only. Fixed-point closure stays in the semantic dataflow authority.
- Graph and IR are projections. They do not become semantic authorities.
- CLI route grouping consumes `crudRole` and `actionKind`; HTTP-method action helpers remain compatibility vocabulary and have no production semantic calls.
- CLI type lowering consumes closed request/response/CRUD contracts. Model-name matching in primary-key typing remains an output-type fallback, not route CRUD classification; this is the next optional refinement frontier if the upstream model-key contract is made directly available to resource-group projection.

## External design alignment

MLIR interfaces decouple analyses/transforms from concrete operation semantics and support interface inheritance. CodeQL separates the data-flow graph from AST representation. Clang dataflow propagates facts through CFG edges until a fixed point using lattice semantics. Laravel route/model binding supplies source evidence that should be raised into Route capability contracts upstream. TypeScript's compiler evolution reinforces keeping semantic contracts stable across implementation changes.

## Constraint

No build was run for this phase. This phase is a structural/source audit only.
