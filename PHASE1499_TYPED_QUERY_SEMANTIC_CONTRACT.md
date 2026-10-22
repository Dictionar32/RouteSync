# Phase 1499 — Typed Query Semantic Contract

## Intent

Strengthen the upstream query semantic contract so its interface does not expose broad primitive types as semantic vocabulary. The interface uses existing domain values (`MethodName`, `DescriptionText`, `NumberValue`) and closed judgments. Runtime/wiring must not infer the meaning of unsupported query operators.

## Changes

- Added `createMethodName` so method-name text is converted at the source boundary into the `MethodName` domain type.
- Changed query semantic interface method parameters from `string` to `MethodName`.
- Changed malformed judgment diagnostics from `string` to `QuerySemanticDiagnostic`, whose message is a `DescriptionText` value object.
- Changed query join descriptor argument positions from raw `number` to `QueryArgumentPosition` wrapping `NumberValue`.
- Changed basic `where` operation resolution to reject unknown or malformed explicit operators instead of silently defaulting to equality.
- Updated scanner wiring and query semantic algebra tests for the typed contract.

## Contract boundary

`QueryProducerSemanticInterface` exposes semantic domain types. Primitive strings/numbers remain only at conversion and lookup implementation boundaries, not as the contract's method-name, diagnostic, or join-position types.

## Validation

- TypeScript syntax transpilation passed for all six changed TypeScript files.
- Focused static checks passed: domain-typed method names, domain-typed diagnostics, domain-typed join positions, and fail-closed unknown operators.
- Full project typecheck/test/build was not verified: this workspace has no installed project dependencies, and the available global TypeScript compiler is older than the project's configured `ES2025` target. A targeted compile also reports pre-existing errors in unrelated modules, so it is not represented as a passing build.

## References

- TypeScript Everyday Types: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
