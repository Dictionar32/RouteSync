# Phase 146 — Trace AST → ADT → Interface

## Boundary

ecommerce_shop → PHP AST → domain ADT → downstream semantic model

## Trace

The Laravel source was traced for closures and arrow functions.

- Resource source contains `PaymentResource.php` with `whenLoaded('order', fn () => $this->order->total_harga)`.
- Controller/query source contains multi-statement closures such as `DB::transaction(function () use (...) { ... })` and `whereHas(..., function (...) { ... })`.
- Route closure syntax is represented by the existing `ControllerExpressionContract` and `ControllerStatementContract` rather than reconstructed downstream.

## Repair

The existing `ResourceFieldExpression` ADT was elevated with two semantic variants:

- `closure`
- `arrow_function`

The existing `ResourceExpressionBindingRequirement` was extended with the same semantic variants. The canonical registry, exhaustive visitor, and factory were updated together.

`resourceAstExpressionMapper` now maps arrow functions to `ArrowFunctionResourceExpression` instead of `unsupported_syntax`.

Closure expressions are also represented structurally for resource expressions. Their supported expression-bearing statements are retained as resource expression models; unsupported statement forms remain explicitly rejected rather than silently erased.

## Important architectural result

The source-language `switch`/visitor dispatch remains only at the AST boundary/catamorphism. Downstream consumers receive a semantic variant and do not inspect PHP syntax to rediscover its meaning.

The resource mapper does not import generic AST nodes into downstream models.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reaches only the existing environment blocker:

`packages/core/src/compiler/utils/Hash.ts: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 146.

The targeted Vitest invocation for `ecommerceShopAstPhase87_2.spec.ts` exceeded the 120-second execution limit, so that runtime test is not claimed as passed.

## Remaining semantic audit target

`modelAccessorExpressionMapper` still explicitly rejects direct closure/arrow expressions. For Laravel `Attribute::make(get: fn () => ...)`, this mapper intentionally unwraps the callback and maps its returned expression; the ecommerce source therefore does not lose the accessor's semantic result. A future generic callable model should only be introduced if the domain actually needs to preserve callable identity, not merely to duplicate scanner syntax.
