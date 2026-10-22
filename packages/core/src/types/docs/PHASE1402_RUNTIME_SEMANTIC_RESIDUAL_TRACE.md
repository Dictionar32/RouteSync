# Phase 1402 — Runtime Semantic Residual Trace

## Scope

Trace points: operation identity, semantic ownership, data-loss boundaries, upstream contracts, AST/ADT/dataflow, manifest/graph/IR, CLI hook generation, React, SDK, mapper, Zod, Axios, and TanStack Query.

## Contract-first change in this phase

`RouteSemanticFlow.capability.crudRole`, route target scope, and route-parameter capability are already resolved upstream. The CLI now lowers those values into `crudSlots` in generated hook configuration. React's `resolveGroupSlots` accepts direct endpoint references and parameter names from that contract. The CLI also emits the custom endpoint list with its closed hook kind. The generated path no longer needs to search endpoints by CRUD role, parse endpoint paths, or assume the create endpoint is literally named `create`.

The React hook resolver no longer fabricates query keys from a group name. It must use supplied cache/query-key functions, and fails explicitly if no usable key capability is present.

## Other unknown/runtime behavior traced

### Valid runtime boundary or execution

- `createHooks.ts` checks whether an input is a valid callable SDK endpoint and validates its closed `hookKind` shape. This is boundary validation; it does not infer intent from method/path/action name. The subsequent branch dispatches the supplied hook capability to query/mutation executor.
- `defineApi.ts` receives HTTP response data as `unknown`, executes the selected HTTP transport, applies the configured schema, and invokes the configured mapper. Unknown at the network boundary is intentional until validation establishes a type.
- `GenericService` uses `unknown` for raw HTTP response values. `extractData`, `requireArray`, and schema parsing are boundary normalization/validation. The optional `fromBackend` / `toBackend` / key-case mapping policy is still runtime-configurable and remains a migration frontier for consumers that want compiler-generated closed mapper contracts.
- Zod response/request validation remains runtime execution at the untrusted API boundary; removing it would weaken validation rather than remove semantic reclassification.
- TanStack Query key functions remain executable because query variables affect cache identity. The contract must provide the key; the runtime may call it, but must not invent a semantic key from a group name.

### Semantic interpretation still present

- `groupSlotResolver.ts` retains a compatibility branch for hand-authored configurations that omit `crudSlots`. It still scans `crudRole` and `targetScope`. Generated CLI output uses the contract branch. Removing the legacy branch requires migrating old hand-authored configurations and is not claimed complete here.
- `core/src/types/domain/resourceGroupDescriptors.ts` still has role-based route selection while building compiler-side resource group descriptors. That is compile/generation-time grouping rather than the generated application runtime, but it remains a candidate for a dedicated upstream group capability algebra so the compiler model also consumes a closed group judgment rather than repeatedly searching route arrays.
- `GenericService` remains a separate generic CRUD helper with caller-supplied mapping/schema policies. It is not automatically bound to a generated `OperationIdentityCapabilityContract`; migrating it requires an explicit generic service contract rather than unsafe casts or guessing a route identity.

## Type narrowing applied

The route `cache` policy is now `boolean`, and `retry` is `boolean | RetryConfig` across the core route descriptor, SDK `endpoint()`, and SDK `resource()` config. This removes untyped policy payloads from those boundaries while retaining `false` as a valid opt-out.

## Ownership map

- Laravel source and AST/source evidence: upstream input.
- Semantic identity, hook kind, CRUD role, target scope, route parameter: upstream capability authority.
- `hookConfigLowerer.ts`: deterministic projection from closed capability to direct wiring references.
- React `defineHooks` / `groupSlotResolver`: execute the wiring contract; legacy mode is explicitly marked.
- SDK `defineApi`: executes transport, schema, and mapper contracts; it must not infer semantic endpoint identity.
- Manifest/graph/IR: consume already-owned semantic relations and judgments; AST syntax and semantic dataflow remain separate models.

## Verification limits

The Phase 1402 static audit passed. Source syntax was checked with the available TypeScript transpiler. Full project type-check/build could not run in this workspace: `tsdown` and project type packages are not installed, and the globally available TypeScript compiler does not support the repository's TypeScript 7 target/lib settings. Do not treat source audit success as a successful production build.
