# Phase 2988 — Scanner Statement Sequence Domain Operations

## Scope

This phase continues from Phase 2987 and raises one concrete scanner-sequence boundary in `packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts`. It does not restore any deleted generic relation foundation.

## Changes

- Removed the import of `relationAdvanceIndex` and `relationGate` from the deleted `relationalSequence` module.
- Introduced a scanner-owned `StatementSequenceCursor` operation (`advancePastCurrent`, `advanceBy`) so traversal arithmetic is localized to a domain cursor instead of being spread through the parser.
- Introduced continuation-bearing `StatementSequenceProgressJudgment` (`progressing` / `stalled`) so consumers continue from a domain result instead of repeating progress predicates.
- Introduced continuation-bearing `StatementPartitionJudgment` (`valid_partition` / `invalid_partition`) so partition validation produces an explicit domain decision.
- Kept the exported runtime operation explicit: `export const scannerStatementSequenceAlgebra: ScannerStatementSequenceInterface = Object.freeze({...})`.
- Kept public `StatementSequenceResolution` serializable; continuation functions remain private implementation details.

## Runtime trace

```text
StatementSequenceContract
  → scannerStatementSequenceAlgebra.parse
  → scanner-owned StatementSequenceCursor
  → boundary authority returns StatementBoundaryJudgment
  → StatementPartitionJudgment.continueWith(...)
  → structured-statement executor
      ├─ malformed / contract violation → closed failure judgment
      ├─ resolved → StatementSequenceProgressJudgment.continueWith(...)
      └─ not applicable → domain cursor advances by partition length
  → recursive sequence parse
  → StatementSequenceResolution
```

## Verification boundary

- The modified sequence algebra and its direct interfaces pass strict standalone TypeScript checking.
- Structural audit is defined by `scripts/audits/audit-phase2988-scanner-sequence-domain-operations.cjs`.
- This is not a full repository build. Other scanner files and consumers still contain imports from intentionally deleted relation foundations; these must be migrated at their owning domain boundaries, not by restoring generic modules.
- The scanner statement-control judgment from Phase 2987 and CLI → manifest trace are retained; this phase does not claim that a particular control judgment is serialized into the manifest or IR.
