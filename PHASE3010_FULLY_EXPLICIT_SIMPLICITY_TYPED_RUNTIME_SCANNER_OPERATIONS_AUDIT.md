# RouteSync Phase 3010 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Objective

Continue Phase 3009 by raising two upstream invocation-semantic helpers from exported bare callables to interface-first domain operation objects. Keep the CLI manifest path on the same canonical request factory and preserve the typed semantic judgments rather than adding a parallel interpretation in CLI.

## Implemented changes

### 1. Semantic rule policy resolution

Before: `invocationSemanticRulePolicy(ruleId)` was an exported arrow function whose public shape was inferred from its implementation.

After:

```ts
export interface InvocationSemanticRulePolicyResolutionOperationsInterface {
  readonly resolve: (ruleId: InvocationSemanticRulePolicy['ruleId']) => InvocationSemanticRulePolicy;
}

export const invocationSemanticRulePolicy:
  InvocationSemanticRulePolicyResolutionOperationsInterface = Object.freeze({
    resolve: (ruleId: InvocationSemanticRulePolicy['ruleId']): InvocationSemanticRulePolicy => {
      const policy = INVOCATION_SEMANTIC_RULE_POLICIES.find(candidate => candidate.ruleId === ruleId);
      if (!policy) throw new Error(`Missing invocation semantic rule policy: ${ruleId}`);
      return policy;
    },
  });
```

The algebra now calls `invocationSemanticRulePolicy.resolve(ruleId)`. This makes the public boundary explicit and names the domain operation. The lookup still uses a registry search and an explicit missing-policy failure; this phase does **not** claim to have eliminated every conditional or primitive operation inside the implementation.

### 2. Witness ownership operation

Before: `invocationWitnessOwnerRuleId(witness)` was an exported arrow function.

After, `InvocationSemanticWitnessOwnershipOperationsInterface` defines `ownerOf(witness)`, and the public value is `export const invocationSemanticWitnessOwnership: InvocationSemanticWitnessOwnershipOperationsInterface = Object.freeze({...})`. The authority now checks trace ownership through `invocationSemanticWitnessOwnership.ownerOf(witness)`. This retains the typed mapping from witness variants to semantic rule ownership while moving the callable API behind an explicit interface.

### 3. Runtime path trace

The traced path remains:

1. CLI `scan`, `sync`, or drift audit constructs `ControllerInvocationManifestCompositionInput` through `controllerInvocationManifestCompositionInputFactory.create(...)`.
2. The input ADT owns `continueToCanonicalization(...)` and preserves the original route-selection intent through canonicalization.
3. Controller source discovery/read, source identity binding, invocation semantic preparation, and inventory closure produce validated invocation judgments.
4. The manifest builder receives the validated inventory receipt and the route-selection intent.
5. The semantic algebra resolves each rule's typed policy through `invocationSemanticRulePolicy.resolve(...)`.
6. The authority validates witness ownership through `invocationSemanticWitnessOwnership.ownerOf(...)`.
7. The completed manifest and invocation judgments flow to the existing CLI projections and output writers.

The two new operation objects are shared upstream operations, not a second semantic authority and not duplicated manifest data.

## PHP/Laravel grounding

Laravel's official routing documentation distinguishes controller actions, route parameters, dependency injection, and route-model binding. The scanner should preserve those distinctions as upstream typed evidence; CLI must not infer them again from primitive route strings. PHP's type-declaration documentation describes parameter/return type constraints; correspondingly, the new TypeScript operation boundaries declare their complete callable contracts.

- Laravel Routing: https://laravel.com/framework/docs/routing
- PHP Type Declarations: https://www.php.net/manual/en/language.types.declarations.php

## Verification

- Structural audit: `PHASE3010_AUDIT.json`, **10/10 checks passed**.
- Syntax transpilation: `PHASE3010_SYNTAX_CHECK.json`, **8 files, 0 syntax diagnostics** using the globally available TypeScript compiler in ES2022 transpile mode.
- No `export function` declarations were found in the scoped runtime slice checked by the audit. This is not a repository-wide declaration inventory.
- Full TypeScript typecheck, unit tests, and Laravel CLI end-to-end tests were not run in this phase. Syntax transpilation and structural checks do not establish full type correctness or runtime success.
- `packages/core/src/types/upstream/collections.ts` remains whitespace-only (1 byte).
- Deleted relation foundation modules remain absent and were not restored.

## Remaining audit scope

This phase changes two concrete upstream operation APIs. It does not convert every exported arrow function across the repository, does not eliminate all `if`/`switch`/`===`/`??` usage, and does not complete field-by-field provenance from each Laravel source fact through every final manifest field. Those require separate reachable-call-graph and data-provenance audits rather than blind syntax replacement.
