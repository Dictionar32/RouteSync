# Phase 2761 — Fully Typed AST / ADT Runtime Export Inventory

## Trace

`CLI program -> upstream composition -> controller invocation inventory -> manifest builder -> Laravel source AST -> complete source model -> manifest judgment -> validation -> serialization -> persistence -> CLI result`.

AST and source-model blockers remain distinct ADT variants. Rejected validation, serialization, and persistence results must not be translated into successful empty manifests.

## Public operation conventions

Phase 2761 established the inventory and baseline conventions. Phase 2762 then migrated the 75 exported function declarations found in the CLI and scanner runtime scopes into explicitly annotated `export const` values with exported call-signature interfaces and `Object.freeze`. The callable signature preserves existing import/call-site contracts; generator and async semantics are retained. Object-shaped operation bundles remain appropriate where a caller is explicitly designed to consume named operations as properties.

## Audit

Run `npm run audit:phase2761-runtime-export-inventory` for the manifest/ADT anchors and `npm run audit:phase2762-interface-first-runtime-operations` for the export migration. Both use the TypeScript Compiler API to parse CLI and scanner scopes. The current audit reports zero exported function declarations in those scopes. Generated-code strings containing `export function` are not source function declarations and are not counted as AST function declarations.

## Verification boundary

These structural audits do not replace semantic typechecking, unit tests, package builds, or CLI end-to-end tests. The full semantic typecheck could not be verified in this environment because project dependencies/type definitions are unavailable and the globally installed TypeScript compiler does not accept the repository's `ES2025` target. Existing repository-level issues around `semantic/relations` reachability and the independent 34-law verifier remain outside this phase.

## References

- TypeScript interfaces and function call signatures: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript discriminated unions: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- TypeScript Compiler API: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
