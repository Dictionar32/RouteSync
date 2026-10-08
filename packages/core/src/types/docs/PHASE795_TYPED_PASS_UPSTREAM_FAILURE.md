# Phase 795 — Typed Pass Upstream Failure ADT Frontier

## Trace

The local DTS frontier was `TypedPassAdapter.ts` at the two pass-execution
`catch` sites. Strict TypeScript rejects the host catch binding as `unknown`.
The old normalization also used `String(error)`, which leaked arbitrary host
values into the compiler-pass failure message.

## Model elevation

The failure boundary is now normalized once into the upstream closed ADT
`CompilerPassFailure`:

- `compiler_pass_error` carries canonical `ExceptionName` + `StringValue`.
- `compiler_pass_non_error` carries canonical failure identity + a closed
  semantic message for a non-`Error` thrown value.
- `compilerPassFailureMessage` consumes the ADT through `relationVariantFold`.
- `TypedPassAdapter` consumes this upstream model in both cached and uncached
  execution paths.

The host `unknown` exists only at the executable exception boundary; it does
not cross into the semantic pass model. `String(error)` is removed.

## Scope

This phase does not introduce parsed descriptors, free dataflow fields, or a
new parallel semantic authority. It reuses the existing upstream value-object
vocabulary (`ExceptionName`, `StringValue`) and exports the new closed ADT
through `types/upstream/index.ts`.

## Audit

`node scripts/audit-phase795-typed-pass-upstream-failure.cjs` must report
`allPass: true`.

The sandbox has no installed workspace `node_modules`, so a full `npm run build`
cannot be reproduced here. A focused strict TypeScript invocation was also
blocked by unrelated existing repository errors and missing Node typings; no
error was reported for the changed Phase 795 files themselves.
