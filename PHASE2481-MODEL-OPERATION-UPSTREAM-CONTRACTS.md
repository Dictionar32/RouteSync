# Phase2481 — Model Operation Upstream Contracts

## Scope

This phase closes two missing operation contracts on the Laravel model-production path without relocating implementation files or introducing duplicate local interfaces.

## Changes

- Evolved the existing upstream `modelProducerInterface.ts` contract module to declare `ModelSemanticDefinitionFromAstInterface<DeclarationEvidence, PropertyEvidence>`.
- Declared `ModelAstFromSemanticInterface` in the same upstream contract module. The contract imports only upstream model/AST/value contracts and does not import compiler lexer types.
- Replaced the local function-type interface in `subscanners/model/modelParser.ts` with `export const modelSemanticDefinitionFromAst: ModelSemanticDefinitionFromAstInterface<...> = Object.freeze(...)`.
- Replaced the local function-type interface in `subscanners/model/modelCanonical.ts` with `export const modelAstFromSemantic: ModelAstFromSemanticInterface = Object.freeze(...)`.
- Updated `laravelModelScanner.ts` to call the explicitly modeled `.form(...)` and `.project(...)` operations.
- Kept implementation files at their existing paths. No file relocation was performed.
- Added `scripts/audits/audit-phase2481-model-operation-upstream-contracts.cjs` and registered its package script.

## Structural verification

- Phase2481 operation-contract audit: 8/8 passed.
- Phase2479 producer-contract audit: 8/8 passed.
- Phase2480 producer-scanner migration audit: 8/8 passed.
- Phase2477 model upstream relation-independence audit: 12/12 passed.
- Phase2467 model-property upstream authority audit: 14/14 passed.
- TypeScript transpile syntax checks for the five changed TypeScript files passed.

## Known open work

- The semantic formation and AST projection implementations still live in `subscanners/model/`; this phase makes their operations interface-first but does not retire the directory.
- The semantic formation operation still consumes compiler AST evidence supplied by the scanner. The upstream contract is generic and has no direct lexer import, but source-evidence ownership is not fully migrated.
- Other production consumers of `subscanners`, `lexer`, `semantic/relations`, and `semantic/foundation` remain to be traced and migrated before any broad deletion.
- Full project typecheck is blocked by existing repository diagnostics, including invalid syntax in `effectiveControllerActionPolicyResolver.phase921.test.ts`, a `ResponseDtoPropertyTypeEvidence` missing name, missing Node typings for `path`, and numerous unrelated type errors. The repository `tsconfig.json` also targets ES2025, which the available `tsc` executable rejects.
- Full build, Vitest, and end-to-end CLI verification have not been completed.
