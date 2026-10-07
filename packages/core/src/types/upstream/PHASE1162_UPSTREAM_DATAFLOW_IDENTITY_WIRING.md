# Phase 1162 — Upstream Dataflow Identity Wiring

## Trace

The canonical route remains:

`Laravel source -> CompleteLaravelSourceModel -> SemanticDataflowInput -> semanticDataflowAuthority -> DataFlowInterface -> analysis/IR`

The generic `DataFlowInterface<Input, State, Node>` remains unchanged. TypeScript 6's modern strict direction (`strict`, explicit `types`, modern `ES2025` target/lib, and `isolatedDeclarations`) supports this separation; the workspace is already pinned to TypeScript 7.0.2, so TS6 is treated as the compatibility baseline rather than the active compiler.

## Boundary repair

The manifest dataflow projection previously exposed controller/action strings only. Downstream analysis then reconstructed a `${controller}.${action}` slot and searched `SemanticDataflowInput.node.slot`.

That reconstruction was removed. The projection now carries the canonical upstream `SemanticDataflowIdentity` from `ControllerActionFlowContract.semantic.dataflow.node` as `dataflowNode`.

Downstream analysis resolves the corresponding manifest input with `semanticDataflowIdentityEqual(candidate.node, controller.dataflowNode)`.

This preserves the architecture:

`upstream semantic identity -> manifest transport -> downstream interface wiring -> DataFlowInterface consumer`

and prevents downstream string reclassification.

## Why this is the stronger model

MLIR interfaces are designed so generic analyses operate through stable interfaces without encoding concrete operation/dialect semantics. CodeQL similarly separates semantic data-flow nodes/edges from AST syntax and lets analysis configuration define source/sink policy. RouteSync follows the same boundary: Laravel/controller identity stays upstream, while `DataFlowInterface` remains domain-neutral.

## Validation status

Static trace confirms no remaining production `controllerSlot` reconstruction in the manifest dataflow analysis path. The container does not have the workspace dependencies installed: `npx tsc --version` resolves to an environment TypeScript 5.8.3 and `npm run build` cannot run because `tsup` is absent. Therefore no full TypeScript 7.0.2 build result is claimed here.
