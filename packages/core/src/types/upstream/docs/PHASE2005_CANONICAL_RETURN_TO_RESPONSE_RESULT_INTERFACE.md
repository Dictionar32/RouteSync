# Phase 2005 — Canonical Return to ResponseResult Interface First

## Trace finding

Phase 2004 correctly preserved the existing `ControllerReturnSemantic` ADT, but stopped at a closed method-return product. The response executor therefore still had no concrete `ResponseResult` product for methods whose return semantics already prove one. The legacy `responseProducer` had its own private return-to-result mapping, but wiring that subscanner into the pipeline would preserve duplicate ownership and its permissive generic-expression-to-JSON assumption.

## Contract-first change

The existing `LaravelControllerResponseSemanticJudgmentAuthorityInterface` now owns a typed `returnResponseProjection` dependency. Its contract is based on the canonical `ControllerReturnSemantic` ADT and produces a closed projection judgment:

- `response` reuses its already canonical `ResponseResult`.
- `resource` and `model` project to typed `ResponseResult` variants using their existing model/resource identities.
- `branches` complete only when every branch has a concrete result.
- `absent` and generic `expression` remain unresolved; they are not guessed as empty or JSON responses.

When every declared method has a concrete result, the existing response authority emits `controller_response_method_products_complete` with a method-scoped `controller_method_response_products` product. Otherwise it preserves `controller_response_return_semantics_complete` and the canonical return ADT, without claiming an HTTP response result that has not been proven.

## Integration boundary

The existing response runtime executor still delegates to the existing response authority. The controller scanner still forwards the resulting closed response judgment to the existing AST projection authority. The new return projection is a nested contract of that authority, not a parallel top-level response authority, and no new `relation` or `foundation` subscanner is introduced.

## Verification limits

The phase audit checks contract shape, ADT projection cases, executor wiring, AST forwarding, and absence of a new subscanner. TypeScript transpile syntax diagnostics are reported separately from a full project typecheck. Full project typecheck/build is not claimed as passing unless the repository toolchain completes it successfully.
