# Phase 3077 — Source Read Settlement Domain Operations

## Scope

Continue the real upstream → CLI → manifest runtime path from Phase 3076. This phase replaces the generic `continueWith<Result>` operation on individual source-read settlements with a source-read-specific operation that contributes each settled read to a typed batch accumulator.

## Implementation

Changed `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`:

- Removed `PhpSourceDocumentReadOperationSettlementHandlers<Result>` and the generic `continueWith<Result>` member from individual source-read settlements.
- Added `PhpSourceDocumentReadOperationBatchAccumulator`, whose domain operations are `includeFulfilled`, `includeRejected`, and `finish`.
- Added `PhpSourceDocumentReadOperationSettlementDomainOperations.contributeToBatch(accumulator)`.
- Fulfilled settlements contribute their requested source identity and read result; rejected settlements contribute the source identity and normalized failure evidence.
- The batch authority owns aggregation and preserves read order and every rejection. The final batch judgment retains the existing manifest-facing fulfilled/rejected behavior.
- Public runtime factory remains interface-first: `export const phpSourceDocumentReadOperationSettlementFactory: PhpSourceDocumentReadOperationSettlementFactoryInterface = Object.freeze({...})`.

The CLI composition remains unchanged at its manifest boundary: it consumes the final batch judgment and sends rejected reads to the existing blocked manifest terminal. Core does not depend on CLI terminal types.

## Runtime trace

```text
CLI scan / sync
  → manifest composition authority
  → discovered canonical source inventory
  → sourceDocumentReader.read(sourceFile)
  → fulfilled/rejected settlement factory
  → settlement.contributeToBatch(source-read accumulator)
  → source-read batch judgment
  → fulfilled: source identity binding → document batch
  → rejected: blocked manifest terminal with all source identities and normalized evidence
```

## Audit

`node scripts/audits/audit-phase3077-source-read-settlement-domain-operations.cjs`

Result: **13/13 structural checks passed**. Changed TypeScript files passed syntax transpilation. Prior audit artifacts for Phases 3072, 3074, 3075, and 3076 remain present; this phase's audit script checks their presence, not reruns of each audit.

## Limits

- Whole-workspace strict TypeScript was not run; the workspace has no local `node_modules/.bin/tsc` or package TypeScript setup available in this runtime.
- PHP → CLI → manifest end-to-end execution was not run.
- The final batch judgment still exposes a generic continuation for CLI terminal routing. That is a separate boundary and is intentionally not claimed solved here.
- Collection traversal still uses an index and the accumulator still uses array collections. This phase does not claim global elimination of `number`, arrays, `reduce`, `if`, `switch`, `===`, `??`, or ternaries.
- Deleted generic relation foundation modules remain absent; `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.

## Next frontier

Model the final batch judgment's manifest-neutral outcome operation, then normalize filesystem blocker evidence in source discovery at the CLI adapter boundary before it enters the upstream ADT. Preserve source identity, provenance, and all blocker diagnostics throughout.
