# Phase 575 — Build Trace: Compiler Bridge Canonical Barrel

## Frontier

Continue the DTS migration after the validation-descriptor export cutover.

## Root cause

`packages/cli/src/generators/CompilerBridge.ts` consumes canonical bridge types from `./bridge`, but `packages/cli/src/generators/bridge/index.ts` exported only a subset of `bridgeTypes.ts`.

The missing exports caused DTS failures for:

- `CompilerOutput`
- `FormOutput`
- `ContractOutput`
- `ApiFieldOutput`
- `MapperOutput`
- `EmittedCompilerArtifacts`
- `FullBundleEmittedArtifacts`
- `CompilerBundleOptions`
- `CompilerEmitContext`
- `CompilerEmitter`

## Change

Extended the explicit bridge barrel to expose the existing canonical types from `bridgeTypes.ts`. No compatibility implementation or duplicate type definitions were introduced.

## Verification

The checkpoint environment does not contain a usable `tsup` executable. A full `npm run build` therefore could not be executed in this environment. Global TypeScript is present, but the workspace dependency set is incomplete.
