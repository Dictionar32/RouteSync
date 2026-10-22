# Phase 2605 — CLI Host Composition Loader

## Change

The standalone CLI now loads a host-owned semantic composition module named by `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE`. That module must export `requestTypeDerivationSemanticComposition`. The CLI validates the outer capability shape, passes it through the existing canonical assembler and manifest composition factory, and dispatches only when assembly succeeds.

## Ownership

- Upstream contract and ADTs remain owned by `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- Semantic reasoning, complete law verification, decision, authority, and integrity remain owned by the host composition implementation.
- CLI owns module loading and command dispatch only; it does not synthesize semantic judgments or law proofs.

## Fail-closed behavior

- Missing module path: CLI exits with a configuration diagnostic.
- Missing or malformed export: CLI exits with a composition diagnostic.
- Contract identity mismatch: canonical assembler rejects composition; CLI exits without dispatch.
- Import failure: CLI reports the load failure and exits.

No legacy `RequestType[]` fallback is introduced. The loader is wiring, not a claim that the repository now contains a concrete production reasoning producer or independent verifier for all 34 laws.

## Host module contract

Set `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` to an absolute path, a path relative to the current working directory, or a resolvable package export specifier. Package specifiers are passed to the module resolver directly, so a public upstream export can be loaded without a filesystem wrapper. The module must export:

```ts
export const requestTypeDerivationSemanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface = /* host-owned complete capabilities */;
```

The host remains responsible for creating a source-bound inference packet and independently verifying every canonical law. The CLI only validates the capability boundary and delegates assembly to the existing core/CLI composition functions.

## Verification

Run `node scripts/audits/audit-phase2605-cli-host-composition-loader.cjs`. This is a structural audit only. Typecheck, build, tests, and a live CLI run require the project dependency environment and a real host composition module.
