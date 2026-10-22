# RouteSync Phase 2510 — Laravel FormRequest Upstream Cutover

## Scope

This phase cuts direct `semantic/relations` imports out of the active FormRequest scanner, request producer, and TypeInterner implementation. It also makes the TypeInterner capability contract upstream-owned and keeps the active FormRequest wiring connected to `laravelFormRequestScanner: LaravelFormRequestScannerInterface`.

It deliberately does not edit the legacy files under `compiler/scanner/subscanners`.

## Changes

- `compiler/scanner/laravelFormRequestScanner.ts`: replaced direct relation helper calls with typed source iteration, method lookup, and sequence construction. The scanner remains explicitly assigned to `LaravelFormRequestScannerInterface` and its scan input is explicitly typed as `LaravelFormRequestScanInput`.
- `compiler/scanner/operations/requestProducer.ts`: replaced direct relation helper calls with direct typed ADT inspection and collection projections for authorization, validation lifecycle, messages, attributes, validation policy, and failure response configuration.
- `types/upstream/typeInternerInterface.ts`: added the upstream-owned `TypeInternerInterface` contract.
- `compiler/types/TypeInterner.ts`: implements the upstream contract and no longer directly imports relation utilities.
- `types/upstream/requestProducerInterface.ts`: now refers to the upstream `TypeInternerInterface` instead of the compiler's concrete `TypeInterner` implementation.
- `scripts/audits/audit-phase2510-laravel-form-request-upstream-cutover.cjs`: focused structural audit with explicit open-debt reporting.

## Verification

- TypeScript syntax transpilation passed for the five modified TypeScript files.
- Focused `tsc` diagnostics were run with TypeScript 5.8.3 and target `ES2024`. The modified files had no reported type diagnostics other than missing Node type declarations for `path` and `node:fs` in this environment. The full dependency graph still reports pre-existing errors in other files, so this is not a successful package typecheck.
- The repository's default `tsc --noEmit` cannot validate this checkout with the globally available TypeScript 5.8.3 because `tsconfig.json` requests a newer target/lib and contains unrelated syntax diagnostics in `effectiveControllerActionPolicyResolver.phase921.test.ts`.
- Full build, Vitest, and CLI end-to-end were not run.

## Explicitly unresolved

This phase is a partial cutover, not a claim that the entire FormRequest dependency graph is relation-free or that all subscanners are retired:

1. `requestProducerInterface.ts` still imports lexer/parser AST types from compiler modules; the upstream input contract is not yet fully ownership-closed.
2. `operations/requestAstCanonical.ts` and `operations/form-request/*` still directly import `semantic/relations`.
3. `compiler/types/TypeHasher.ts` still imports `semantic/relations`, so TypeInterner's transitive dependency closure is not relation-free.
4. The active pipeline still imports other legacy subscanners for response, schema, migration, DTO, query, service, middleware, and provider.

The next valid step is to close the producer's semantic input contract upstream and migrate those remaining consumers at their proper owners before deleting their old implementations. Moving or wrapping old code alone is not sufficient evidence of completion.
