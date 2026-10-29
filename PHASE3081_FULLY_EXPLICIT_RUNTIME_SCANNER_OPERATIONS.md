# Phase 3081 — Fully Explicit Typed Runtime Scanner Operations

## Implemented change

The source-read batch accumulator in `packages/core/src/types/upstream/phpSourceFrontendInterface.ts` is now a closed state union:

- `PhpSourceDocumentReadOperationBatchOpenAccumulator`
- `PhpSourceDocumentReadOperationBatchRejectedAccumulator`

The open state can accumulate fulfilled reads and transition to the rejected state when the first rejection arrives. The rejected state can continue accumulating fulfilled reads and rejections, but its operations always return the rejected state. Its `finish` operation always creates rejected batch evidence. The previous `rejected.length === 0` decision has been removed.

The runtime export remains interface-first:

```ts
export const phpSourceDocumentReadOperationBatchFactory: PhpSourceDocumentReadOperationBatchFactoryInterface = Object.freeze({
  // source-read domain operations
});
```

## Runtime trace

`CLI scan/sync composition` → `discovered source inventory` → `discoveredSourceReadSettlementOperation.readAll` → `PhpSourceDocumentReadOperationSettlement` → `contributeToBatch` → closed source-read accumulator → fulfilled/rejected batch judgment → existing CLI manifest terminal / identity binding → document batch → semantic invocation → manifest builder → generator.

The source-read domain remains manifest-neutral: core does not import CLI manifest terminal types. Rejection source identity, normalized failure evidence, and read ordering remain represented in the existing domain evidence.

## Structural audit

Run:

```sh
node scripts/audits/audit-phase3081-source-read-closed-batch-state.cjs
```

Result: **12/12 structural checks passed**. This includes source syntax transpilation, interface-first export, closed-state transitions, preserved rejection evidence, the one-newline `collections.ts` invariant, and confirmation that deleted relation foundation files remain absent.

## Not claimed as complete

- Full strict TypeScript workspace typecheck was not run; dependencies/toolchain are not installed in this extracted workspace.
- Full test suite and PHP → CLI → manifest → generator end-to-end execution were not run.
- The final batch judgment still uses generic `continueWith<Result>`.
- Settlement traversal still uses index-based recursion.
- Stale relation-foundation import debt previously recorded as 478 lines across 251 files has not been re-counted or migrated in this phase.

## Next migration

Replace index-based traversal with a typed sequence/cursor domain operation while proving stable source order. Then replace generic final batch continuation with a manifest-neutral typed operation without making core depend on CLI terminal types. Run strict TypeScript, focused source-read tests, and end-to-end integration after those changes.

## PHP/Laravel modelling references

PHP's official type-system documentation describes interfaces and nominal domain types; Laravel's resource/controller conventions should be mapped into RouteSync's own source/semantic evidence model rather than treated as generic string-based control flow. These references inform the design but do not substitute for runtime integration tests.
