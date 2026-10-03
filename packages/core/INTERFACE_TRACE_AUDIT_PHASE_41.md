# Interface Trace Audit — Phase 41

## Scope

Controller AST/ADT vocabulary and controller route/request flow interfaces.

## Laravel semantic boundary

Laravel 13 documents that `Illuminate\Http\Request` is injected into controller
methods through the service container, while route parameters and model binding
are supplied by the route/controller boundary. The source model therefore needs
to expose the resulting facts; downstream flow interfaces do not need to resolve
Laravel behavior themselves.

## Trace

```text
Laravel PHP
  -> PHP lexer AST
  -> scanner adapter
  -> upstream ControllerExpression ADT
  -> upstream ControllerAction / Route / Request facts
  -> passive flow interfaces
  -> downstream consumers
```

## Findings

1. `compiler/scanner/descriptors/request/controllerExpressionContract.ts`
   contained a scanner-local expression ADT plus its resolver.
2. No active source consumer imports that module.
3. The same semantic controller-expression vocabulary already existed under
   `types/domain/controllerExpression.ts`.
4. `ControllerRuntimeReturn` was also downstream-owned even though it only
   contains upstream `Expression` values.
5. Controller route/request flow interfaces in `types/upstream/highLevelContracts.ts`
   already act as passive data surfaces; their construction belongs in the
   upstream source-model layer.

## Fix

- Added `types/upstream/controllerExpression.ts` as the single owner of the
  controller-expression ADT and runtime-return vocabulary.
- Exported it from the upstream barrel.
- Converted `types/domain/controllerExpression.ts` into a compatibility barrel,
  preventing a second vocabulary during migration.
- Moved compiler consumer imports to upstream ownership.
- Tombstoned the unused scanner-local ADT/resolver instead of physically deleting
  the path, preserving overlay-safe deletion semantics.
- Added a phase-41 type-contract test for upstream ownership.
- Kept `highLevelContracts.ts` passive: it carries route/request binding evidence;
  correlation remains in `highLevelSourceModel.ts`.

## Result

The upstream layer is more capable because it owns the canonical ADT, while the
flow interface remains intentionally dumb: it transports already-resolved facts
and performs no Laravel lookup, AST parsing, or semantic correlation.
