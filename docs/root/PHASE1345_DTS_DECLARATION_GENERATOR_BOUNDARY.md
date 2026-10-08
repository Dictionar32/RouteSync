# Phase 1345 — TypeScript 7 declaration generator boundary

## Trigger

The Phase 1344 workspace built JavaScript chunks, then failed during declaration generation with 101 `TS9008`, `TS9010`, and `TS9013` diagnostics from the isolated-declaration transform. The visible diagnostics include inferred public methods in `Request`, `HttpClient`, and `TokenManager`, plus `SemanticValueFactory`.

## Change

- Keep root `tsconfig.json` strict and retain `isolatedDeclarations: true` as the main source/compiler boundary.
- Add `tsconfig.dts.json`, extending the root config but setting `isolatedDeclarations: false` for declaration generation only.
- Configure tsdown's declaration generator to use TypeScript Go (`generator: 'tsgo'`) with the declaration-specific config. TypeScript 7.0.2 is already pinned by this repository.
- Keep the existing JavaScript bundle tsconfig and all package scripts; add only `audit:phase1345-dts-generator-boundary`.

## Rationale

`isolatedDeclarations` requires every exported declaration to be locally annotatable without whole-program inference. The current source has a large set of exported methods and factories that don't yet satisfy that requirement. Declaration output can instead be generated with the TypeScript 7 compiler using the full type graph, while the root config continues to preserve the project's strict source setting. This is a declaration-generator boundary adjustment, not a claim that the 101 source annotations have all been added.

## Verification status

The focused configuration audit validates that the root setting remains enabled, the declaration-only setting is overridden, the TypeScript Go generator is selected, and existing build/audit scripts remain present. The full `npm run build` must still be run in the repository's local dependency environment; this extracted workspace does not contain `node_modules`.
