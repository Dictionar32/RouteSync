# Phase2943 — Fully Explicit Route Outcome Contract Closure

## Scope

Close a contract mismatch at the upstream route-scan composition boundary. The runtime implementation of `outcomeFromScan` already returns an operation-bearing `LaravelRouteScanOutcome`, but the interface previously advertised the weaker data-only `LaravelRouteScanOutcomeData` union. That weak contract could erase the continuation capability from the prepared scanner's declared type and make the runtime contract less explicit than the implementation.

## Change

- `LaravelRouteDeclarationCompositionAuthorityInterface.outcomeFromScan` now returns `LaravelRouteScanOutcome`.
- Removed the obsolete data-only `LaravelRouteScanOutcomeData` alias and its public barrel export. Route outcomes must retain `continueToSourceAstProjection(...)` as part of the public contract.
- Kept terminal creation at its existing domain-producing boundaries: complete, source-selection-blocked, source-read-blocked, response-blocked, and policy-blocked outcomes are created through `laravelRouteScanOutcomeOperations`.
- Kept `packages/core/src/types/upstream/collections.ts` empty.
- Added a repeatable Phase2943 structural audit.

## Runtime trace

```text
CLI scan/sync
  -> manifest scan operation
  -> controller invocation manifest composition
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelRouteScannerInterface.prepare(input)
  -> PhpSourceDocumentReaderInterface.read(input)
  -> PhpSourceDocumentReadBatchJudgment.continueWith(...)
  -> LaravelRouteDeclarationCompositionAuthorityInterface.outcomeFromScan(scan)
  -> LaravelRouteScanOutcome.continueToSourceAstProjection(continuation)
  -> LaravelSourceAstProjectionJudgment
  -> manifest build judgment / CLI publication gate
```

The source-read failure path remains a distinct blocked judgment; it must not be represented as a successful empty scan or manifest.

## Verification

- Phase2940 structural audit: 11/11 passed.
- Phase2942 route-scan continuation audit: 9/9 passed.
- Phase2943 route-outcome contract closure audit: 8/8 passed.
- TypeScript syntax transpilation for six changed/relevant files: 6/6 passed.
- `package.json` JSON parse: passed.
- `collections.ts`: 0 bytes.

A legacy Phase2584 trace audit currently reports 9/17 assertions passed because eight assertions target an older CLI composition architecture; it is not a passing gate for this phase. Full TypeScript typecheck, unit tests, build, and CLI end-to-end remain unverified because project dependencies/types are not installed in this workspace and the global TypeScript compiler has incompatible support for the repository's configured ES2025 target/lib. Syntax transpilation is not a substitute for typechecking.

## Remaining work

- The repository-wide `export function` migration is not complete. A TypeScript-AST inventory found 482 exported function declarations across `packages/core/src` and `packages/cli/src`; the full list is in `PHASE2943_EXPORTED_FUNCTION_INVENTORY.csv`. The traced production scope (`packages/cli/src`, `packages/core/src/compiler/scanner` excluding `__test__`, and `packages/core/src/types/upstream`) has no exported function declarations; one scanner test helper remains under `__test__`. Each broader migration needs the correct existing domain interface before conversion; do not invent interfaces for generic helpers.
- Continue tracing upstream contracts and explicit barrel exports before adding new contracts.
- Keep operation-bearing ADTs at the domain boundary and do not replace meaningful domain relationships with generic helper abstractions.
