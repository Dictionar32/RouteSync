# Phase2883 — Source Read Batch Domain Accumulator

## Scope

This phase addresses the concrete `results.reduce(...)` aggregation in `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`.

## Change

- Replaced `Array.reduce` and the post-hoc `blockedReads.length === 0` classification with a domain-specific accumulator.
- A complete accumulator accepts complete documents while remaining complete.
- Accepting the first blocked read transitions the accumulator to a blocked accumulator.
- A blocked accumulator retains partial documents and every subsequent blocker.
- The terminal batch judgment exposes `continueWith` and keeps complete vs blocked evidence explicit.
- No generic collection ADT was added; `packages/core/src/types/upstream/collections.ts` remains empty.
- Added `audit:phase2883-read-batch-domain-accumulator`.

## Trace

`PhpSourceDocumentReadResult.continueWith(...)`
→ `PhpSourceDocumentReadBatchAccumulator.acceptComplete(...)` or `.acceptBlocked(...)`
→ accumulator-owned terminal judgment
→ `PhpSourceDocumentReadBatchJudgment.continueWith(...)`
→ CLI composition terminal or complete-document continuation.

## Verification

- Phase2883 structural audit: 7/7 passed.
- Phase2882 identity judgment audit: 9/9 passed.
- TypeScript compiler API was not available through Node's standard module resolution in this workspace; syntax parsing and full typecheck were not verified.
- Build and end-to-end tests were not run.

## Remaining findings

The project identity factory still has `sourceRoot: string` and `dataflowQueryPolicyIntent?` in `sourceProjectIdentity.ts`. This phase does not claim those concerns are solved. The next change should trace and migrate all real call sites to a domain-typed root and an explicit policy-selection ADT, then verify the full consumer set rather than retaining an optional parameter or introducing a compatibility overload.
