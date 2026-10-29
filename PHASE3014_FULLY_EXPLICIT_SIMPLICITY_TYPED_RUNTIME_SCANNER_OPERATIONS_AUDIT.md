# Phase 3014 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope

This phase continues the Phase 3013 invocation-semantic runtime trace and targets one reachable exported callable that constructed an explicit “positional evidence unproven” value. The work is intentionally narrow: migrate that callable behind the existing upstream operation interface rather than perform a repository-wide syntax rewrite.

## Change

Before, consumers imported and called a standalone helper:

```ts
invocationPositionalEvidenceUnproven(invocation)
```

Now the upstream operation contract declares:

```ts
readonly unprovenPositionalEvidenceFor: (
  invocation: SemanticInvocation,
) => InvocationPositionalEvidenceInput;
```

The public runtime surface remains the interface-first frozen object:

```ts
export const invocationSemanticKnowledgeAlgebraOperations:
  InvocationSemanticKnowledgeAlgebraOperationsInterface = Object.freeze({
    kind: 'invocation_semantic_knowledge_algebra_operations',
    analyze: analyzeInvocationSemanticKnowledge,
    analyzeOne: analyzeOneInvocationSemanticJudgment,
    callTargetsFor: callTargetsForInvocation,
    parameterFlowsFor: parameterFlowsForInvocation,
    unprovenPositionalEvidenceFor,
  });
```

The value-producing implementation is now module-private. The authority and focused tests call the named domain operation. The batch implementation uses the private implementation locally, preserving ownership and avoiding unnecessary self-dispatch through the exported object.

## Runtime trace

1. The upstream invocation judgment authority validates the requested invocation and its evidence.
2. For batch analysis, the invocation algebra constructs an explicit `positional-evidence-unproven` ADT when positional correspondence has not been established.
3. That ADT retains its `argument_form_unproven` obligation tied to the exact invocation; the operation does not invent confirmed positional correspondence.
4. The authority invokes `invocationSemanticKnowledgeAlgebraOperations.analyzeOne(...)` and validates the resulting judgment.
5. Scanner-facing route-AST consumers use the same named operation surface and keep the same invocation identities.
6. The validated judgments continue through the existing inventory/manifest path; this phase does not change manifest fields or claim new end-to-end coverage.

## Why this is a domain-model improvement

The change removes a standalone exported callable from the upstream public surface and makes construction of the unproven evidence variant part of the same typed domain-operation contract as invocation analysis and projections. It does not introduce a generic reasoning helper, a second source of truth, or a duplicate relation foundation.

It also does not mechanically remove `if`, `switch`, `===`, `??`, or other control flow. Branches that classify semantic outcomes require separate domain review; replacing their syntax without modeling their knowledge would not satisfy the stated design goal.

## Verification

- Structural audit: **12/12 passed** (`PHASE3014_AUDIT.json`).
- TypeScript transpilation: **5 files, 0 syntax diagnostics** (`PHASE3014_SYNTAX_CHECK.json`).
- Targeted strict TypeScript check of the three production modules: **passed, exit code 0** (`PHASE3014_TYPECHECK.log`).
- Unit tests: not run.
- Laravel CLI end-to-end: not run.
- ZIP integrity: checked after artifact creation.

The typecheck scope was limited to `invocationSemanticAlgebraInterface.ts`, `invocationSemanticJudgmentAlgebra.ts`, and `invocationSemanticJudgmentAuthority.ts`; it is not a full repository typecheck.

## Workspace invariants

- `packages/core/src/types/upstream/collections.ts` remains one newline byte.
- `relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` remain absent; no kernel re-exports were restored.
- The audit does not claim repository-wide removal of `export function` or all unannotated exported callable constants.

## PHP / Laravel documentation relevance

Laravel route callbacks and controller actions encode meaningful parameter ordering, dependency injection, and route-model binding. RouteSync should preserve those facts as upstream semantic evidence instead of re-inferring them from downstream output. See [Laravel Routing](https://laravel.com/framework/docs/routing).

PHP type declarations constrain accepted parameter and return values, but declarations alone do not establish provenance or semantic truth. RouteSync therefore needs explicit TypeScript operation contracts alongside source-backed invocation evidence. See [PHP Type Declarations](https://www.php.net/types.declarations).
