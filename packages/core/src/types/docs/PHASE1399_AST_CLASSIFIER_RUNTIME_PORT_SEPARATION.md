# Phase 1399 — AST classifier port/runtime separation

`astClassifierEvidence.ts` is now a narrow adapter implementing the upstream `AstClassifierEvidenceInterface`. It exposes syntax classification capabilities and a single-input semantic evidence operation; it no longer contains the PHP parser/classifier implementation. The implementation lives in `astClassifierRuntime.ts`.

The classifier and semantic-evidence relation consumers call the port rather than importing a namespace containing the implementation's entire export surface. The upstream contract is compiler-independent and parameterizes token/value/block types so its capability shape does not depend on scanner runtime types.

Boundary:

`PHP source / tokens → astClassifierRuntime (implementation) → AstClassifierEvidenceInterface (port) → semantic evidence relations / AST classifier → upstream semantic reasoning and dataflow contracts → manifest / graph / IR projections → SDK / React consumers`.

The contract is exported from the upstream type barrel. Static consumer trace confirms that only the adapter imports `astClassifierRuntime` directly. This phase isolates implementation behind a port; it does not claim that the PHP parser itself has been replaced by an abstract AST algebra or that every downstream consumer has already been migrated. Those remain separately auditable concerns.
