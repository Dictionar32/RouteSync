# Phase 107 — Controller Dataflow Branch / Scope / Merge

## Target
Repair the information-loss boundary where controller variable definitions created inside `if`, `foreach`, `for`, and `catch` were previously treated as globally available.

## Flow
`Laravel source -> tokens -> PhpStatement -> ControllerBodyAst -> ControllerDataflowAst -> ControllerDataflowContract -> ResourceBinding`

## Changes
- Added `controllerDataflowAnalyzer.ts` as the dedicated control-flow/dataflow pass.
- Added `ControllerDefinitionAvailability` to the dataflow interface.
- Definitions now distinguish `definite`, `branch_conditional`, `loop_conditional`, and `catch_conditional`.
- Branch merge keeps only definitions available on every path.
- Loop and catch bindings do not become definite after leaving their control-flow region.
- Reference origin now carries the actual definition statement index instead of the reference statement index.
- `ControllerDataflowContract` resolves model origins only from definite definitions, preventing conditional definitions from becoming false resource/model bindings.
- Existing method-chain origin logic remains intact.

## Example corrected semantics

```text
if ($condition) {
    $order = Order::find($id);
}
return new OrderResource($order);
```

Result:

```text
$order definition: branch_conditional
$order reference after if: external / unresolved
```

The scanner therefore refuses to invent `OrderResource -> Order` from a definition that is not guaranteed to exist at the return point.

## Verification
Focused TypeScript compilation of the modified dataflow AST, analyzer, parser, and controller dataflow contract passes with no diagnostics.

Repository-wide compilation/tests are not claimed green because the workspace already contains unrelated legacy errors outside this boundary.

## Next boundary
The next semantic loss is `Resource -> field/property path`, including expressions such as `$this->order?->promotion` and `$this->paymentDetail?->detail`. That information should become a structured path ADT before semantic type resolution and lowering.
