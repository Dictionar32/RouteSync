# Phase 3078 changelog

- Moved rejected source-file inventory accumulation into the source-read batch accumulator.
- Removed post-hoc `reduce` from rejected-batch finalization.
- Preserved read/rejection ordering, normalized failure evidence, blocked manifest terminal wiring, interface-first factory shape, and the protected `collections.ts` invariant.
- Added structural audit `audit:phase3078-source-read-rejection-inventory-domain-operations`.
