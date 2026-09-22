# Phase 106 - Ecommerce Shop Method-Chain Dataflow Origin

## Boundary repaired

`ControllerDataflowContract` previously resolved a variable only when its definition was a direct static call. A query-builder chain therefore lost its upstream model/table origin.

Example repaired flow:

`$orders -> $query->paginate(15) -> $query -> Order::query() -> Order`

and:

`$data -> DB::table('orders')->get() -> DB::table('orders') -> table(orders)`

## Changes

- `resolveModelOrigin()` now traverses `method_chain.receiver` recursively.
- Static calls remain the origin boundary for model-class and table origins.
- Variable-definition recursion remains explicit and guarded by a visited-variable set.
- Resource discovery now traverses method-chain receivers and function-call arguments, so resources nested in `response()->json(...)` remain visible.
- Production `resourceModelMap` remains removed.
- No `Record<string, string>` replacement was introduced.

## Verification

The changed `controllerDataflowContract.ts` compiles standalone with TypeScript 5.8.3 using ES2022/CommonJS/node resolution and `--skipLibCheck`.

Repository-wide green status is not claimed because Phase 105 already had an unrelated syntax error in `packages/core/src/compiler/scanner/subscanners/semantic/route-response/propertyProcessor.ts:77` and stale SDK tests still reference the removed `resourceModelMap` API.

## Remaining boundary

The next upstream semantic gap is branch-sensitive dataflow: scope, definite assignment, and merge semantics. After that, trace the resolved resource model into resource-field/property-path dataflow so field semantics are not reconstructed downstream.
