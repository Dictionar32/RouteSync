# Phase 1111 — Upstream → Wiring → Interface → Downstream closure

This phase uses the complete Phase 1106 workspace as baseline and overlays the latest Phase 1109 wiring/domain state.

## Canonical direction

```text
Laravel source
  -> scanner/parser
  -> types/upstream semantic authority
  -> compiler/scanner/wiring
  -> InterfaceDependencyBoundary / DataFlowInterface
  -> graph / dataflow / IR / CLI
```

## Ownership

- `types/upstream`: route, controller, model, model relation, resource, schema, manifest and semantic dataflow contracts.
- `compiler/scanner/wiring`: concrete manifest construction, migration AST adapter, semantic-dataflow runtime adapter, route semantic resolvers, manifest projection and type lowering.
- `InterfaceDependencyBoundary`: generic directional downstream-owned projection contract.
- `DataFlowInterface`: generic execution/state/fixed-point/query contract only.
- graph: structural projection from the upstream graph surface.
- IR: projection of canonical dataflow state; no semantic re-derivation.
- CLI: package-surface consumer; no direct `core/src` imports.
- `StaticLaravelScanner`: retired.

## Retired location

Production TypeScript was removed from `compiler/scanner/upstream`. That directory is no longer a compiler implementation lane.

## Remaining frontier

`types/domain` still contains 28 production files importing compiler modules. This is explicitly tracked as a separate domain/compiler-materialization migration frontier; it is not classified as a `types/upstream` violation.

## Generic contracts

`DataFlowInterface<Input, State, Node>` remains domain-neutral.

`InterfaceDependencyBoundary<Upstream, Downstream>` remains directional and generic. Neither contract is widened with Laravel-specific semantics.
