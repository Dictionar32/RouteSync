# Phase 572 — Build Trace: FormGeneratorPass Request Identity

## Trace
`build(8).log` reached successful ESM/CJS builds for core, sdk, react, and cli. DTS failed only at `FormGeneratorPass.ts:74-75` because `RequestType` no longer exposes a top-level `resourceName` field.

## Root cause
`RequestType` is modeled around `identity: RequestIdentity`, and `RequestIdentity.resource` is the authoritative `ResourceName`. `ResourceName.value` is a `StringValue`, whose primitive string is `value.value`.

## Fix
Updated `FormGeneratorPass` to project the resource name from the canonical identity boundary:

- `reqType.resourceName` → `reqType.identity.resource.value.value`
- template interpolation uses the same canonical projection.

No duplicate scalar resource name was reintroduced into `RequestType`.
