# Phase 3049 — Assignment Reference Domain Operations

## Purpose

Raise PHP assignment-reference knowledge into the upstream domain model. The previous identity authority inspected `assignment.reference.code` to decide whether an assignment should contribute alias evidence. That duplicated a domain decision in a consumer.

## Model change

`SemanticAssignmentReferenceDefinition` now owns `identityProjection.project(assignment)`:

- `by_value` projects no identity-binding evidence.
- `by_reference` projects one `SemanticAssignmentReferenceIdentityBinding` carrying the canonical assignment ID, both endpoint KnowledgeIds, and source provenance.

The object identity authority consumes the projected binding evidence. It no longer checks `reference.code` itself. The proof's `assignment_reference` fact also retains `SemanticSource`.

## Runtime trace

1. PHP AST parsing retains the assignment-reference mode as syntax evidence.
2. The existing PHP semantic mapping resolves that mode into the canonical upstream `SemanticAssignmentReferenceDefinition`.
3. The definition's identity projection produces source-backed binding evidence.
4. `semanticObjectIdentityAuthority.analyze` consumes projected bindings to derive alias relations and proof facts.
5. The integrated semantic response continues through the existing interface-backed CLI manifest scan and controller-invocation manifest composition.

## Verification

The Phase 3049 audit checks the closed domain contract, source provenance, both reference modes, use of the existing CLI manifest interfaces, absence of the deleted relation-foundation modules, and the one-byte `collections.ts` invariant.

The focused strict TypeScript check and focused test execution are the scope of this phase. Full repository typecheck, full Vitest, and CLI-to-manifest end-to-end execution are not claimed.

## Remaining limitations

This is not a complete PHP reference/heap model. It does not yet model alias propagation through object properties, array slots, references passed through callable parameters, or callable mod/ref summaries. Parser-boundary primitives and other control-flow constructs remain outside this focused change. The phase does not claim global elimination of primitive types or all branching.
