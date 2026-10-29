# Phase 2776 — Explicit Source Scan Judgment ADT

## Why the previous contract was underspecified

The prior sketch used an undeclared `SourceScanBlockReason`, did not bind either result to the project/category/stage that produced it, and represented completion only as a generic `readonly T[]`. It could not distinguish a domain-owned complete payload from a collection representation, nor make the presence/absence of partial evidence explicit.

## Contract added

`sourceScanJudgment.ts` defines:

- `SourceScanStage`: closed tagged union of runtime scanner and downstream stages.
- `SourceScanRequiredInput`, `UnsupportedSourceConstructKind`, `SourceScanPolicyKind`, and `SourceScanDependencyKind`: closed vocabularies rather than arbitrary reason strings.
- `SourceScanBlockReason`: tagged union with source/project evidence for each failure family.
- `SourceScanCompletionWitness`: project/category/stage-bound proof composed from `SourceScanInventoryClosureWitness` and `SourceScanProjectIdentityBindingWitness`, rather than boolean flags or an empty-array sentinel.
- `SourceScanComplete<Payload>`: carries a domain-owned payload instead of introducing a collection abstraction.
- `SourceScanBlocked<PartialPayload>`: retains a typed reason and an explicit `source_scan_partial_payload` versus `source_scan_no_partial_payload` variant.
- `SourceScanJudgment<CompletePayload, PartialPayload>`: closed complete/blocked union.
- `SourceScanRuntimeOperationInterface<Input, CompletePayload, PartialPayload>`: explicit runtime scanner operation signature, with typed input and distinct complete/partial payloads.

This does not repopulate `collections.ts` and does not introduce `Sequence<T>`. It also does not yet migrate all scanner and manifest call sites to this new contract; that remains a separate integration task, and must be verified with typecheck and tests.

## Runtime usage shape

A scanner interface should expose a typed operation object whose method returns `Promise<SourceScanJudgment<CompleteDomainPayload, PartialDomainPayload>>`. The `CompleteDomainPayload` must be the actual category-specific aggregate, not `unknown`, `any`, a primitive flag, or a new generic collection wrapper. A consumer must switch on `judgment.kind`, then switch exhaustively on `judgment.reason.kind` for blocked outcomes.

TypeScript references:

- https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
