# Phase 105 Trace: ecommerce_shop Dataflow Boundary Repair

## Ground truth

The repair continues from the actual `ecommerce_shop` Laravel source archive used for Phase 104. Generated manifests are not treated as source truth.

## Boundary found

Phase 104 produced `ControllerBodyAst.statements` and `ControllerBodyAst.dataflow`, but `ControllerBodyResolution` previously returned only validation/error information. `scanControllerAction()` then constructed an empty `resourceModelMap`, and `resourceDataflowAggregator.ts` reduced controller bindings to `Map<string, string>` with frequency/convention heuristics.

That was a lossy boundary.

## Repair

The controller contract now carries:

```text
ControllerBodyAst
  -> ControllerDataflowAst
  -> ControllerDataflowContract
       -> original AST dataflow
       -> ControllerResourceBinding[]
```

`ControllerResourceBinding` is closed around an explicit model origin:

```text
model_class(name)
table(name)
```

No controller resource-model `Map<string, string>` is used in the production scanner path.

Resource bindings are derived from actual return syntax:

```text
new Resource($model)
Resource::collection($models)
```

The model argument can originate from:

```text
parameter type
local assignment -> static model call
local assignment -> DB::table('...')
```

The binding is then resolved by `ResourceModelResolver` against `ModelSymbolTable`.

## Dataflow preservation

The semantic controller body resolution now preserves both:

- `statements`
- `dataflow`

The scanned controller action descriptor carries `dataflow` directly instead of reconstructing an empty legacy map.

## Separation of concerns

Controller-origin dataflow and relation propagation are now distinct contracts:

```text
ControllerResourceDataflow
  -> controller-origin bindings

RelationPropagationMap
  -> resource graph propagation
```

The latter remains a graph-specific representation rather than being incorrectly treated as controller dataflow.

## Remaining limitation

Branch-sensitive dominance, definite-assignment, and branch merge semantics are still not fully modeled in `ControllerBodyParser`. The current repair prevents the later semantic boundary from discarding the Phase 104 dataflow, but it does not claim complete control-flow analysis.

Next required semantic boundary is:

```text
control-flow scope
 -> branch/loop binding environment
 -> definite-assignment / merge ADT
 -> resource field dataflow
 -> semantic type resolution
 -> domain IR
```

## Verification

- New production files remain below the requested 100-line file limit.
- The focused TypeScript invocation reaches an existing unrelated syntax error in `packages/core/src/compiler/scanner/subscanners/semantic/route-response/propertyProcessor.ts:77`; no Phase 105-specific TypeScript error was emitted before that parser failure.
- Existing repository-wide TypeScript errors remain unrelated legacy failures and are not represented as Phase 105 regressions.
- The old `resourceModelMap` field is absent from `packages/core/src` production code.
