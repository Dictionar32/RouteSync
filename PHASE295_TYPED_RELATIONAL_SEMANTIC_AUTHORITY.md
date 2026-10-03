# Phase 295 — Typed Relational Semantic Authority

## Objective

Raise the semantic execution layer above host-language collection traversal.
Canonical semantic analysis now consumes typed relations and relation algebra.
The parser/syntax boundary remains the only layer that knows concrete source
construct vocabulary.

## Execution substrate

- `semanticTypedRelation.ts`
- `semanticRelationalAlgebra.ts`
- `semanticRelationStore.ts`
- `semanticRelationSolver.ts`
- `semanticConstraintCalculus.ts`
- `semanticRewriteEngine.ts`
- `semanticClosureEngine.ts`

Canonical analysis modules migrated to the typed relation substrate:

- `semanticDataFlowAnalyzer.ts`
- `semanticStateDataFlow.ts`
- `semanticObjectIdentity.ts`
- `semanticInterproceduralDataFlow.ts`
- `semanticVersionedStateDataFlow.ts`
- `semanticKnowledgeDataFlowModel.ts`

## Retired execution overlays

The old Phase 217–227 analysis overlays were removed from the canonical package
surface. Their roles are superseded by the relational substrate rather than
maintained as separate procedural semantic interpreters.

Removed from the canonical export surface:

- sparse data-flow overlay
- property data-flow overlay
- knowledge lattice overlay
- evidence fusion overlay
- context-sensitive data-flow overlay
- demand-driven data-flow overlay
- memory-dependence overlay
- heap-versioning overlay
- historical Phase 236 relation solver

The authoritative path is now relation schemas + constraints + rewrites +
closure/provenance.

## Forbidden execution vocabulary audit

The canonical semantic production surface is audited for:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`

and for the retired control ontology:

`SemanticChoice`, `SemanticRepetition`, `controlRelations`, `semanticControl`,
`semanticRuleEngine`, `statementKnowledge`.

Parser grammar and syntax/evidence infrastructure remain outside this audit;
concrete PHP syntax must still be recognized there.
