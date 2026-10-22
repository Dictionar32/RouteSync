# Phase 1971 — Policy Scope Closed Judgment Root-Cause Trace

## Scope

Trace the existing `ControllerPolicyActionScopeJudgmentInterface` and its authority before changing runtime. No `relation` or `foundation` subscanner is introduced.

## Confirmed root cause

`controllerPolicyActionScopeJudgmentAuthority.ts` currently returns `ControllerPolicyActionScope` directly. Its `actionNames()` returns an empty action sequence for unsupported expression forms and silently skips unsupported array entries. Therefore a dynamic expression such as `only: $methods`, or an array containing a non-string expression, can be misrepresented as a resolved empty allow-list. That is not a valid semantic conclusion: it is missing evidence collapsed into a successful ADT case.

The same authority selects the first named `only` and `except` argument with `.find()`. Duplicate named scope arguments are not represented as an ambiguity/blocked judgment.

This is an interface/model defect, not a runtime execution defect. The interface promises a closed result but cannot distinguish complete interpretation from insufficient evidence.

## Evidence paths

- `packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentInterface.ts`: `analyze` returns `ControllerPolicyActionScope` directly.
- `packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.ts`: `actionNames` drops unsupported values; `namedScopes` selects the first matching named argument.
- `packages/core/src/types/upstream/controller.ts`: `ControllerPolicyActionScope` only represents `all`, `only`, `except`, and `only_except`; it has no blocked/unresolved outcome.
- `packages/core/src/types/upstream/routeMiddleware.ts`: `RouteMiddlewareScope` likewise has no unresolved outcome.
- `packages/core/src/compiler/scanner/upstream/route/routeMiddlewareFlowResolver.ts`: `scopeApplies` returns a boolean and `RouteMiddlewareFlow` always appears complete, so it cannot preserve uncertainty from an upstream scope judgment.
- `packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts`: effective policy is always returned as a complete `EffectiveControllerActionPolicy`.

## Interface-first correction required

Evolve the existing scope judgment contract, rather than adding a parallel authority:

1. Define `ControllerPolicyActionScopeJudgment` as a closed ADT with `resolved` (containing the existing scope ADT) and `blocked` outcomes.
2. Make blocked reasons domain-specific: duplicate `only`, duplicate `except`, unsupported `only` expression, unsupported `except` expression, and unsupported array entry. Preserve the relevant typed expression/argument evidence.
3. Change the existing authority's `analyze` return type to that judgment. Never turn an unsupported expression into an empty action list.
4. Evolve the existing controller policy relation and route middleware scope contract to preserve a blocked scope judgment, or make their enclosing policy result a `complete | blocked` ADT. Do not coerce blocked to `all`, an empty list, or `false` applicability.
5. Evolve `RouteMiddlewareFlow` and `EffectiveControllerActionPolicy` into complete/blocked judgments so a downstream consumer cannot mistake an incomplete scope for a complete empty middleware set.
6. Only after the contract is closed, adapt the canonicalizer and runtime executor to project resolved cases and preserve blocked outcomes.

## Why no partial code rewrite is included here

Adding only an `unresolved` case to the scope union would force all consumers to handle it, but mapping it to `false` would silently omit middleware and mapping it to `true` would mishandle exclusions. The safe fix must propagate the blocked judgment through route middleware flow and effective policy together. A one-file change would hide the root problem rather than solve it.

## External semantic reference

Laravel's controller middleware API explicitly models `only` and `except` as scope constraints. TypeScript discriminated unions support distinct resolved/blocked outcomes and exhaustive consumers. See Laravel API docs for `Illuminate\\Routing\\Controllers\\Middleware` and the TypeScript handbook on discriminated unions.

## Verification boundary

This phase records a source-traced root cause and implementation contract. It does not claim that the implementation defect is fixed, that tests pass, or that TypeScript compilation succeeds. No build was run.
