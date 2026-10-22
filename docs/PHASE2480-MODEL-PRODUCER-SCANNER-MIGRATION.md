# Phase 2480 — Model Producer Scanner Migration

## Scope

Continue from Phase2479 using the supplied ZIP workspace. No files were relocated. The composite producer operation was migrated into the existing `laravelModelScanner.ts` module and the old `subscanners/modelProducer.ts` implementation was retired after rewiring its only traced consumer.

## Changes

- Reused the existing upstream `ModelProducerInterface`, `ModelProducerInput`, and `ModelProducerResult`.
- Added `export const modelProducer: ModelProducerInterface = Object.freeze(...)` in `laravelModelScanner.ts`.
- Wired `produceResult` directly to the existing semantic model builder and AST projection operations.
- Deleted `subscanners/modelProducer.ts`; no implementation file was moved to another directory.
- Updated Phase2478 and Phase2479 audits to reflect that their producer-location assumptions are superseded by Phase2480.
- Added `scripts/audits/audit-phase2480-model-producer-scanner-migration.cjs` and registered it in the root package scripts.

## Verification

`node scripts/audits/audit-phase2480-model-producer-scanner-migration.cjs` — 8/8 checks passed.

The updated Phase2478 and Phase2479 audits are also expected to pass against the new wiring. Full TypeScript typecheck, package build, Vitest, and end-to-end CLI verification were not run in this environment because installed package toolchains/dependencies are not present in the extracted workspace.

## Open architectural blockers

1. `ModelProducerInterface` and `ModelProducerInput` are generic over declaration/property evidence, so the upstream contract no longer imports compiler-owned lexer types. The concrete scanner binds those evidence parameters to the actual lexer AST types.
2. The producer still delegates to `subscanners/model/modelParser.ts` and `subscanners/model/modelCanonical.ts`. Phase2480 removes the subscanner producer wrapper, but it does not claim that the model parser/canonicalizer dependency closure has been migrated.
3. `laravelModelScanner.ts` still directly uses `LaravelSourceLexer`, `parseModelDeclaration`, and lexer token types.
4. Repository-wide subscanner, `semantic/relations`, and `semantic/foundation` retirement remains unverified. Deleting these trees before tracing and migrating every active consumer would be unsafe.

## Architecture note

TypeScript interfaces provide a named structural contract; they do not themselves make the implementation upstream-owned or remove runtime dependencies. The contract and implementation dependency direction must be verified separately. Laravel Eloquent model semantics must preserve attributes, casts, accessors, and relationships, as reflected in the official Laravel Eloquent documentation.
