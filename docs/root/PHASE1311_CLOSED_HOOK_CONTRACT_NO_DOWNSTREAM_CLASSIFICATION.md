# Phase 1311 — Closed Hook Contract, No Downstream Classification

## Trace scope

This phase traces `genericHooksAxios`, `operationIdentityCapability`, `semantic-ownership-coverage`, `core/src/types/upstream`, `react/src/*`, `sdk/src/*`, `cli/src/*`, `examples/ecommerce-shop-source`, and `Engine.Fix.md` from the Phase 1310 archive.

## Findings and correction

1. `OperationIdentityCapabilityContract` is type-only. Runtime construction remains in `operationIdentityCapabilityAuthority.ts`; projection remains in wiring.
2. Route hook meaning is produced upstream by `routeCapabilitySemanticAuthority.ts`. React must consume the closed `RouteDefinition.hookKind`; it must not derive hook kind from HTTP method, path, or endpoint naming.
3. `hookTypes.ts` previously expressed query/mutation selection as a repeated conditional `InferHookKind<T> extends ...` chain. It now uses `HookSignatureByClosedKind` indexed by the already-closed `hookKind`. This is a signature projection table, not a hook-kind classifier.
4. `useUpdateSelf` previously fell through `updateSelf → update → put → patch`, allowing transport aliases to reconstruct response semantics. It now reads only the explicit `updateSelf` semantic action; absence is represented as `unknown`, not guessed from transport aliases.
5. `semantic-ownership-coverage.cjs` now guards against the old conditional classifier and the update/put/patch fallback returning.

## Boundary law

```text
Laravel/source evidence
  -> upstream semantic authority / relational reasoning
  -> closed capability + proof/contract
  -> type-only consumer interface
  -> explicit upstream wiring / projection
  -> React / SDK / CLI consumer
```

- `hookKind`, `actionName`, `payloadLocation`, response cardinality, mapper ownership, and operation identity are upstream judgments.
- Interfaces carry closed values and typed relationships; they do not solve constraints or infer semantic ownership.
- Projection may choose a target signature from a closed discriminant, but may not infer that discriminant from transport syntax or names.
- `Engine.Fix.md` output shapes (`api.ts`, `api-read.ts`, `api-form.ts`, `api-mapper.ts`, `hooks.ts`) remain unchanged.

## Validation boundary

The source-level semantic ownership audit is run after this phase. Full workspace build is not claimed unless the repository's configured TypeScript toolchain and dependencies are available and `npm run build` completes successfully.
