# Phase 3050 — Assignment Reference Fact-Domain Continuation

## Goal

Move assignment-fact classification out of the object-identity authority and into a concrete upstream domain operation. This is a scoped architecture improvement, not a claim that all primitive values or all control flow have been eliminated.

## Change

`semanticAssignmentReferenceFactOperations.identityBindings(facts)` now owns the domain projection from canonical semantic facts to `SemanticAssignmentReferenceIdentityBinding[]`. For assignment facts, it delegates to the reference-mode definition's `identityProjection`. The object-identity authority consumes this result and no longer owns its own `isAssignmentFact` predicate or loop.

The binding keeps the assignment `KnowledgeId`, both endpoint `KnowledgeId`s, and `SemanticSource` provenance. By-value assignments emit no identity binding; by-reference assignments emit the explicit binding.

## Runtime trace

`PHP AST → expression/statement evidence producer → SemanticAssignment fact → SemanticKnowledgeDataFlow.facts → semanticAssignmentReferenceFactOperations.identityBindings → semanticObjectIdentityAuthority.analyze → integrated semantic response → CLI manifest scan interface → controller-invocation manifest composition`.

The CLI interfaces remain the existing runtime path; this phase changes upstream domain ownership rather than inventing a parallel manifest path.

## Audit boundary

The localized `fact.kind === 'assignment'` branch remains inside the upstream fact-domain operation. It has not been mechanically disguised as a lookup table, visitor, or map. Primitive values at parser boundaries remain, and this phase does not claim global removal of `string`, `number`, `boolean`, `undefined`, `null`, `reduce`, empty arrays, nullish coalescing, ternaries, or all conditionals.

Full repository typecheck, full Vitest, and end-to-end CLI-to-manifest execution are not certified by this focused audit.
