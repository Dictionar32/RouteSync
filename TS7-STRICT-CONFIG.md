# TypeScript 7 strict configuration — Phase 1156

RouteSync uses TypeScript 7 with ES2025 and a strict source contract.

## Active strictness

- `strict: true`
- `exactOptionalPropertyTypes: true`
- `noUncheckedIndexedAccess: true`
- `noPropertyAccessFromIndexSignature: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedSideEffectImports: true`
- `forceConsistentCasingInFileNames: true`
- `allowUnreachableCode: false`
- `allowUnusedLabels: false`
- `verbatimModuleSyntax: true`
- `isolatedModules: true`
- `isolatedDeclarations: true`
- `moduleDetection: force`

`strict: true` already enables the strict-family checks such as `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`, `useUnknownInCatchVariables`, and related checks. They are intentionally not duplicated in the config.

## Intent

The goal is not merely to make the compiler complain more. The flags enforce semantic boundaries:

- optional fields must distinguish absence from explicit `undefined`;
- indexed access must acknowledge possible absence;
- index-signature access cannot masquerade as a declared property;
- dead/unused semantic bindings are rejected;
- module syntax remains explicit and preserves import/export meaning;
- each module can be analyzed independently;
- declaration output must be derivable without hidden cross-file inference;
- file casing and control-flow completeness are enforced.

## Deliberate exception

`skipLibCheck` remains `true`. External declaration files are not part of RouteSync's semantic source authority. Turning this off would make dependency declaration noise part of the compiler's source contract rather than strengthening RouteSync's own model.

## TypeScript 7 compatibility

The active configurations use `ES2025`, `ESNext`, and `Bundler`. They do not use TS7-removed legacy settings such as `moduleResolution: node`, `baseUrl`, or ES5 targets.
