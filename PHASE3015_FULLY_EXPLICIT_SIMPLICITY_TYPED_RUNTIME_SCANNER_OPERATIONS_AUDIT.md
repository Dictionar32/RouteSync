# Phase 3015 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope

Continues Phase 3014 on the existing RouteSync workspace. This phase raises the invocation semantic contract checks into one typed upstream operation surface and applies that surface to the single-invocation and whole-knowledge runtime authorities.

## Change

Added `InvocationSemanticContractOperationsInterface` to `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`:

- `validateInput(input): InvocationSemanticInput`
- `validateJudgment(input, judgment): InvocationSemanticJudgment`

In `packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts`, the two validation implementations are now private module operations (`validateInvocationSemanticInput` and `validateInvocationSemanticJudgment`). The public surface is:

```ts
export const invocationSemanticContractOperations:
  InvocationSemanticContractOperationsInterface = Object.freeze({
    validateInput: validateInvocationSemanticInput,
    validateJudgment: validateInvocationSemanticJudgment,
  });
```

The single-invocation authority now uses `invocationSemanticContractOperations.validateInput(...)` and `.validateJudgment(...)`. Whole-knowledge analysis validates every produced judgment through the same operation object. The previous standalone exports `assertInvocationSemanticInputContract` and `assertInvocationSemanticJudgmentContract` are removed from the production owner; repository-wide compatibility outside the inspected runtime call graph is not claimed.

## Runtime trace

1. Scanner/consumer supplies `InvocationSemanticInput` containing typed semantic knowledge, one invocation, and positional-evidence disposition.
2. `invocationSemanticAuthority.analyze` delegates input validation to `invocationSemanticContractOperations.validateInput`.
3. The existing semantic algebra derives the judgment; this phase does not alter derivation rules or invent evidence.
4. The authority delegates cross-field, identity, evidence, proof, and obligation validation to `validateJudgment` through the same operation object.
5. Whole-knowledge analysis uses the same judgment-validation operation for each returned judgment.
6. Existing upstream barrel exports expose the interface and operation object through their current star-export path; no duplicate export path is introduced.

## Audit and verification

- Structural audit: 9/9 checks passed (`PHASE3015_AUDIT.json`).
- Syntax transpilation: 2 TypeScript files, 0 syntax diagnostics (`PHASE3015_SYNTAX_CHECK.json`).
- Strict targeted TypeScript check: passed with exit code 0 for `invocationSemanticJudgmentInterface.ts`, `invocationSemanticJudgmentAlgebra.ts`, and `invocationSemanticJudgmentAuthority.ts` using ES2022, ESNext modules, Node resolution, `--strict`, and `--skipLibCheck`.
- Unit tests, full-repository typecheck, build, and Laravel CLI end-to-end were not run in this phase.

## Invariants

- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
- Deleted relation foundation modules are not restored: `relationMembership.ts`, `relationalSequence.ts`, `semanticRelations.ts`.
- No claim is made that all exported callables in the repository have been converted. This phase consolidates two callables on one reachable upstream invocation-authority path.
- Control flow that validates external evidence remains validation logic; it was not mechanically removed. The change gives validation operations a single typed domain owner rather than disguising decisions as a generic primitive.

## PHP / Laravel relevance

Laravel's routing documentation distinguishes route parameters, dependency injection, controller actions, and route-model binding. Those distinctions should be preserved as upstream semantic evidence and not reconstructed from CLI output. See the official [Laravel Routing documentation](https://laravel.com/framework/docs/routing).

PHP type declarations constrain parameter and return types, but typed signatures alone do not prove source provenance or semantic correctness. RouteSync's typed operation contract therefore complements—not replaces—identity, evidence, and proof validation. See the official [PHP Type Declarations manual](https://www.php.net/manual/en/language.types.declarations.php).

## Next step

Continue the reachable-runtime audit from invocation authority toward inventory closure and manifest composition. Inspect each callable's call sites and ownership before migrating it to `export const name: Interface = Object.freeze({...})`; audit source-field provenance and duplication in parallel. Do not mechanically replace every `if`, `switch`, `===`, or `??` without first deciding whether it represents adapter validation or domain knowledge that belongs in an ADT.
