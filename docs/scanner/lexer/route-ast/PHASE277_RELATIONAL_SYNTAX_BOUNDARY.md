# Phase 277 — Relational Semantic Authority / Syntax Boundary

Phase 277 tightens the separation between source syntax and semantic truth.

## Canonical semantic authority

The following layers are forbidden from representing source control constructs as semantic ontology:

- `semanticKnowledgeDataFlowRelations.ts`
- `semanticCanonicalRelationProjection.ts`
- `semanticConstraintCalculus.ts`
- `semanticRelationalBehaviorKernel.ts`
- `semanticRelationTheory.ts`
- `semanticRelationSolver.ts`
- `semanticRewriteEngine.ts`
- `semanticClosureEngine.ts`
- `semanticCompilationArtifact.ts`
- `phpAstSemanticKnowledgeDataFlowAdapter.ts`

They operate on typed facts and canonical relations. The semantic vocabulary is relational: predicates, candidates, dependencies, requirements, exclusions, precedence, reachability, recurrence, effects, and invariants.

## Syntax boundary

Concrete PHP statement spellings are confined to `phpAstStatementSyntaxEvidenceRegistry.ts`. This file is an evidence adapter from parser structures into neutral semantic evidence/facts. The canonical semantic adapter does not dispatch on PHP statement spellings.

This is deliberately stronger than renaming a construct. The source syntax remains observable as evidence, while semantic truth is represented only through relations and solved closure.

## Solver/rewrite path

```text
parser syntax
    ↓
syntax evidence boundary
    ↓
typed semantic facts
    ↓
canonical semantic relations
    ↓
constraint + relational solver
    ↓
rewrite / normalization
    ↓
proof-carrying closure
    ↓
semantic compilation artifact
```

## External architecture evidence

Tree-sitter documents itself as a parser generator/incremental parser producing concrete syntax trees, while CodeQL explicitly describes its data-flow graph as distinct from syntactic structure and notes that some AST constructs do not correspond to data-flow nodes. Soufflé treats relations as sets of typed tuples and computes declaratively specified relations. MLIR PDLL and DRR provide declarative match/rewrite systems. cvc5 exposes relations with join, transpose and transitive closure. K uses rewrite-based executable semantics. These support keeping syntax and semantic derivation as separate layers rather than making source control constructs the semantic ontology.
