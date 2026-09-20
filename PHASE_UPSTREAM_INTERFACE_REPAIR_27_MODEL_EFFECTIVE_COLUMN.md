# Phase 27 — Model Effective Column Interface

## Scope
Upstream interface only. Producers/consumers are intentionally not migrated yet.

## Trace finding
The model consumer path searched the model's casts by column and then selected either the cast semantic type or the database-derived type. That means the consumer re-classified one column from two separate collections.

## Repair
`ModelColumnFact` now carries `cast` as a closed ADT:
- `no_cast`
- `cast` with its effective target and provenance

The semantic model column therefore becomes a single self-contained fact instead of requiring downstream `casts.find(column)` and a fallback branch.

## Principle
If two pieces of upstream data are semantically one decision, they must travel as one contract. Downstream must not reconstruct effective type by joining collections.

## Expected compile errors
The model scanner currently constructs `ModelColumnFact` without the new `cast` field. This is intentional migration pressure. Do not weaken the interface or add downstream fallback logic.
