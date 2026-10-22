# Phase 2156 — Response Descriptor Presence Closure, Interface First

## Trace finding

`resolveControllerActionContract()` produced a canonical `ControllerResponse` from the existing `ResponseDescriptor`, but its presence decision only recognized `kind === 'resource'`. The existing response ADT also includes `model`, `inline`, and `void`; therefore model and inline descriptors were incorrectly projected as `response_absent` even though those variants carry concrete response descriptors.

This local mapping fed three downstream consumers: `controllerReturnSemanticFromMethod`, `createControllerDataflowContract`, and `ControllerActionContract.semanticResponse`. The same incorrect absence fact could therefore affect action return semantics and dataflow.

## Change

The resolver now reuses the existing exhaustive `matchResponse` visitor from `types/domain/responses`:

- `resource` → `response_present` using the descriptor's canonical response type name.
- `model` → `response_present` using the descriptor's canonical response type name.
- `inline` → `response_present` using the descriptor's canonical response type name.
- `void` → `response_absent`.

One `responsePresence` ADT value is forwarded to return-semantic derivation, dataflow construction, and the action contract. This retires the resource-only classifier without creating a new authority, moving logic into a duplicate file, or introducing `relation/foundation` or a subscanner.

## Ownership boundaries preserved

- `ResponseDescriptor` remains the existing domain ADT and source of descriptor-kind knowledge.
- `ControllerActionContract` uses the resulting `ControllerResponse` consistently.
- The existing `LaravelControllerActionSemanticJudgmentAuthorityInterface` production composition remains in place; this phase does not claim that all legacy action derivation has been retired.
- Controller-wide integrated response remains owned by `LaravelControllerResponseSemanticPipelineInterface`; it is not flattened into the per-action response-presence ADT.
- Request authority retirement from Phase 2155 remains unchanged.

## Validation boundary

The Phase 2156 audit is a static source-contract audit. Syntax-only TypeScript transpilation may be run on the changed source, but neither that nor this audit substitutes for a full TypeScript typecheck, monorepo build, or Vitest suite. Those broader checks are not run in this phase.
