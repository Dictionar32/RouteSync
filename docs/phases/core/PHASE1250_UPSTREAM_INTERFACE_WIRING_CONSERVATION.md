# Phase 1250 — Upstream Interface/Wiring Conservation

## Boundary repaired

The semantic path is now enforced as:

`Laravel source → upstream relation/reasoning → closed capability/contract → consumer interface → UpstreamWiringInterface → manifest/graph/IR/CLI`.

### Repairs

1. IR path-parameter projection consumes `RouteSemanticFlow.identity.parameters.path`. It no longer derives a parameter type from the parameter name during production projection.
2. `annotate` resource discovery consumes materialized manifest response semantics. Its PHP template no longer performs Resource/Response classification with regexes.
3. The architecture audit now rejects those two semantic-reconstruction patterns.

## Algebra/contract/interface rule

`SemanticReasoningAlgebra → SemanticReasoningContract → SemanticReasoningInterface` owns reasoning semantics.

`SemanticCapabilityAlgebra → SemanticCapabilityContract → SemanticCapabilityInterface` owns closed semantic facts.

`SemanticDataflowAlgebra → SemanticDataflowContract → SemanticDataflowInterface` owns semantic dataflow judgments.

`UpstreamWiringInterface` transports these contracts and must remain free of `infer`, `resolve`, `classify`, or semantic lookup operations.

## External alignment

MLIR uses interfaces to let analyses/transforms consume semantic capabilities without encoding concrete operation-specific knowledge. CodeQL likewise separates AST representation from data-flow graph representation. Laravel route model binding demonstrates that route semantics can include model identity, custom keys, and scoping, so downstream name heuristics are not a safe semantic authority.
