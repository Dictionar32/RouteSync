# Phase 3013 — Fully Explicit Simplicity Typed Runtime Scanner Operations Audit

## Scope

Continue Phase 3012 on the reachable PHP route-AST interprocedural semantic path. Replace bare callable exports for invocation semantic algebra analysis and projection with one explicitly typed domain-operation object, and migrate consumers to named authority operations.

## Implementation

### 1. Explicit operation contract

Added `InvocationSemanticKnowledgeAlgebraOperationsInterface` in `packages/core/src/types/upstream/invocationSemanticAlgebraInterface.ts`:

- `analyze(knowledge)` — derives analysis for the whole semantic knowledge model.
- `analyzeOne(knowledge, invocation, positionalEvidence)` — derives a judgment for one invocation.
- `callTargetsFor(analysis, invocation)` — projects callable targets for a requested invocation.
- `parameterFlowsFor(analysis, invocation)` — projects argument-to-parameter flows for a requested invocation.

### 2. Typed frozen runtime object

`packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts` now exposes:

```ts
export const invocationSemanticKnowledgeAlgebraOperations:
  InvocationSemanticKnowledgeAlgebraOperationsInterface = Object.freeze({
    kind: 'invocation_semantic_knowledge_algebra_operations',
    analyze: analyzeInvocationSemanticKnowledge,
    analyzeOne: analyzeOneInvocationSemanticJudgment,
    callTargetsFor: callTargetsForInvocation,
    parameterFlowsFor: parameterFlowsForInvocation,
  });
```

The former bare callable exports `analyzeInvocationSemanticAlgebra`, `analyzeInvocationJudgmentAlgebra`, `callTargetForInvocation`, and `parameterFlowsForInvocation` are now private implementation functions behind that object. This moves the exported boundary from inferred function signatures to a single explicit operation contract.

### 3. Authority delegates through the operation model

`packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts` now calls:

- `invocationSemanticKnowledgeAlgebraOperations.analyzeOne(...)` for an individual invocation.
- `invocationSemanticKnowledgeAlgebraOperations.analyze(...)` for whole-knowledge analysis.

The batch authority remains an explicit `SemanticInterproceduralDataFlowAuthorityInterface` object. The operation object is re-exported from the authority boundary and its interface type is exposed through the upstream type barrel.

### 4. Runtime-facing consumer migration

`packages/core/src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts` now exports the typed operation object and authorities instead of the legacy callable aliases `analyzeInvocationSemantics`, `analyzeAllInvocationSemantics`, `analyzeSemanticInterproceduralDataFlow`, `callTargetFor`, and `parameterFlowsFor`.

The relevant route-AST and upstream algebra tests now invoke `.analyze(...)`, `.callTargetsFor(...)`, and `.parameterFlowsFor(...)` on the explicit operation/authority objects.

## Runtime trace

1. The scanner-facing route-AST semantic facade exposes upstream authorities and the typed operation object.
2. For a single invocation, `invocationSemanticAuthority.analyze(input)` validates the request and delegates derivation to `invocationSemanticKnowledgeAlgebraOperations.analyzeOne(...)`.
3. For whole-knowledge analysis, `semanticInterproceduralDataFlowAuthority.analyze(knowledge)` delegates to the same operation object’s `analyze(...)`, then validates every resulting judgment.
4. Consumers project call targets and argument-to-parameter flows through the same operation object. They no longer import the underlying projection functions directly.
5. Proof traces, unresolved obligations, witness ownership, source evidence, and closure validation remain owned by the existing semantic judgment contract; this phase changes the operation boundary, not the semantic derivation rules.

## Verification

- Structural audit: `PHASE3013_AUDIT.json` — **16/16 passed**.
- Syntax transpilation: `PHASE3013_SYNTAX_CHECK.json` — **8 files, 0 syntax diagnostics**.
- Targeted TypeScript typecheck: attempted; it reports existing semantic-model typing errors in `invocationSemanticJudgmentAlgebra.ts` and `invocationSemanticJudgmentAuthority.ts` (including `never`-narrowing / witness typing). Details are in `PHASE3013_TYPECHECK.log`.
- Full workspace typecheck: not cleanly runnable with the installed global compiler because workspace config targets `ES2025`, while this compiler only accepts targets through `ESNext`, and Node/Vitest type packages are unavailable.
- Unit tests and Laravel CLI end-to-end: not run; dependencies are unavailable.

Syntax transpilation is not a substitute for typechecking or runtime tests.

## Preserved constraints

- `packages/core/src/types/upstream/collections.ts` remains whitespace-only.
- Deleted relation foundation modules (`relationMembership.ts`, `relationalSequence.ts`, `semanticRelations.ts`) remain absent; no re-exports were restored.
- No repository-wide mechanical replacement of `if`, `switch`, `===`, `??`, ternaries, or traversal control flow was attempted. Those constructs still need reachability- and semantics-based review.

## PHP / Laravel semantic context

Laravel distinguishes route actions/controllers, route parameters, dependency injection, and route-model binding; these must remain explicit source semantics in upstream models rather than being reconstructed in CLI consumers. See the official [Laravel Controllers documentation](https://laravel.com/framework/docs/12.x/controllers) and [Laravel Routing documentation](https://laravel.com/framework/docs/routing).

PHP documents parameter and return type declarations as runtime type constraints. RouteSync’s explicit TypeScript operation interfaces are analogous as contracts, but type annotations alone do not prove provenance or semantic correctness. See the official [PHP Type Declarations manual](https://www.php.net/manual/en/language.types.declarations.php).

## Remaining work

This phase closes the callable export boundary for the selected interprocedural invocation analysis/projection path. Other callable exports—including `invocationPositionalEvidenceUnproven` and other upstream factories/helpers—remain candidates for a separate reachable-call-graph audit. The next step should inventory their real runtime consumers and migrate them to interface-owned domain operations where that improves the model, then resolve baseline type errors and run focused tests when dependencies are available.
