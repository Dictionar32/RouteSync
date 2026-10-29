# Phase 2878 — Identity Binding Batch Domain Continuation

## Trace and finding

The Phase 2877 CLI composition independently projected identity-binding judgments twice: one `flatMap` collected rejections, another `flatMap` collected bound read results, and a caller-side `if` selected the terminal path. This duplicated domain aggregation in the CLI composition root.

## Change

- Evolved the existing `PhpSourceDocumentIdentityBindingInterface` contract module rather than adding a generic collection abstraction.
- Added domain-specific bound/rejected batch evidence, batch judgment continuation, and `PhpSourceDocumentIdentityBindingBatchFactoryInterface`.
- Added interface-first runtime export `phpSourceDocumentIdentityBindingBatchFactory` with `bindReads` and `fromJudgments` operations.
- The batch ADT preserves all rejected identity evidence as a non-empty tuple; only an all-bound batch exposes read results to the next source-read batch ADT.
- Updated CLI composition to delegate identity binding aggregation and continue through the batch ADT. The CLI no longer performs separate `flatMap` passes or checks `identityRejections.length`.
- Exported the operation through the upstream and core barrels. `collections.ts` remains empty.

## Remaining trace

The CLI still uses `map` to schedule source reads concurrently and to project invocation pipeline inputs/judgments/source identities. Those transformations are not all equivalent: filesystem I/O fan-out is composition wiring, while judgment/inventory construction may merit additional domain-owned batch contracts. This phase does not claim the entire CLI path is free of `map` or branching.

## Verification status

The Phase 2878 audit checks the source structure and barrel wiring only. Typecheck, build, and end-to-end behavior are not claimed as verified.
