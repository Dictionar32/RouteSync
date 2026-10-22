# Phase 1641 — Interface-First Invocation Dependency Slice

## Architectural change

The one-invocation authority no longer calls the aggregate `analyzeInvocationSemanticAlgebra` path. It now computes a single `InvocationSemanticJudgment` directly in upstream algebra.

The interface contract is version 3 and explicitly declares the dependency slice:

- target evidence: requested invocation callable data-flow;
- callable knowledge: resolved targets only;
- emission knowledge: emissions declared by resolved targets only;
- unrelated evidence: excluded before derivation.

## Execution boundary

`core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts` remains a facade. The scanner exposes the runtime executor and compatibility exports, but does not own the inference, relation rewrite, obligation resolution, proof construction, or closure policy.

## Direct judgment path

1. Resolve the canonical invocation evidence by semantic identity.
2. If absent, return an incomplete judgment with a typed missing-evidence obligation and full rule trace.
3. Slice callable-target data-flow to the requested invocation before rewrite.
4. Restrict callable knowledge to the target identities in that slice.
5. Restrict emission knowledge to emission IDs declared by those callables.
6. Derive positional argument bindings, result/exception projections, unresolved obligations, rule trace, proof, and closure for this invocation only.

The batch API remains separately available for consumers explicitly requesting aggregate analysis.

## Verification

- `audit-phase1640-invocation-scoped-judgment.cjs`: 7 static checks.
- `audit-phase1641-invocation-dependency-slice.cjs`: 8 static checks.
- Targeted TypeScript 5.8.3 no-emit check for the changed algebra, authority, executor, and scanner facade.

These checks do not claim the repository's full build or runtime test suite passed; repository dependencies are not installed in this workspace.
