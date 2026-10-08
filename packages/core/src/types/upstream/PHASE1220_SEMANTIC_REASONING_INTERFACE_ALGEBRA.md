# Phase 1220 — Semantic Reasoning Interface Algebra

## Authority path

Laravel source evidence → upstream semantic reasoning relation algebra → proof-carrying reasoning contract → semantic capability/dataflow authority → downstream InterfaceDependencyBoundary → manifest/graph/IR/CLI projection.

## Strengthening

- Added `SemanticReasoningRelationInterface<State, Relation>` so relation derivation is a first-class semantic interface facet.
- Added `SemanticReasoningAlgebraInterface<Input, State, Relation, Judgment>` composing execution + relation + judgment.
- Added `SemanticReasoningAuthorityInterface<Evidence>` as the reusable read-only authority facet shared by capability and dataflow contracts.
- Parameterized capability/dataflow authority reasoning evidence instead of collapsing it to one concrete evidence type.
- Parameterized dataflow projection boundaries with reasoning evidence.
- Reworked route CRUD semantic resolution from direct `if`/`.some`/`.filter` classification into ordered relation candidates resolved through `relationFirstOption`.
- Kept downstream projections read-only: they consume closed capability/dataflow authority and do not reconstruct semantic meaning.

## External alignment

- CodeQL separates AST syntax from semantic data-flow graph nodes and uses source/sink/flow configuration plus transitive closure.
- MLIR uses generic interfaces to decouple analyses from dialect-specific semantics and uses lattice/fixed-point dataflow state.
- Classical dataflow analysis relies on monotone transfer and fixed-point iteration over lattices.
- Laravel route semantics provide route/controller/model-binding evidence at the source boundary.
- TypeScript 7 preserves the structural logic of the existing compiler while moving the implementation to a native Go foundation; the relevant lesson here is architectural continuity rather than copying implementation details.

## Remaining migration frontier

1. `ResourceModelResolver` remains compiler-owned because its input still couples to compiler symbol/resource structures. First define upstream-neutral resource/model evidence, then migrate authority.
2. `semanticDataflowRequestProjection.ts` still performs semantic traversal with imperative branching. Move its request-field inference into relation/candidate/rewrite/fixed-point algebra.
3. `effectiveControllerActionPolicyResolver.ts` still uses collection predicates and loops for semantic policy resolution; migrate the semantic judgment to relation algebra while keeping structural traversal separate.
4. Compatibility facades (`RouteCrudClassifier`, `RouteSecurityResolver`, `RouteDomainResolver`) remain only as compatibility surfaces; do not restore them as semantic authorities.
5. Example manifest fixture should eventually materialize the canonical `dataflowInputs` surface so the fixture exercises the same contract as production.

Build was intentionally not run in this phase; validation is static architecture/audit validation only.
