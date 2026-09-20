# Phase 179 — Trace AST/ADT Interface

## Focus
Grouping property collection: downstream was re-classifying each property resolution with `if (property.kind !== 'resolved')`.

## Change
Introduced `ResourceGroupingPropertyBatchResolution` with resolved/invalid variants and `matchResourceGroupingPropertyBatchResolution`. Grouping now consumes the batch semantic result instead of reconstructing validity from each property.

## Result
Flow: raw grouping arguments → property resolution → property batch resolution → ResourceGroupingArguments → downstream.

No new TypeScript errors. Narrow validation remains blocked only by the pre-existing `Hash.ts` missing `crypto` type/module error.
