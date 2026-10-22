# Phase 2301 — Attribute Scanner Project Identity Input Contract

## Decision

Evolve the existing `LaravelAttributeScannerInterface` in place from contract v16 to v17. Its input is `SourceProjectIdentity`, not `LaravelAttributeScanScope`. The canonical scan scope is fixed to `app/Attributes`; it is result evidence, not a caller-selectable semantic choice.

## Why `sourceProject` is the correct input

- `SourceProjectIdentity` identifies the source project to inspect.
- `LaravelAttributeScanScope` records the bounded directory the scanner actually inspected.
- The current scope type fixes `relativeDirectory` to the literal `app/Attributes`; callers cannot select another valid directory through this contract.
- Passing both values would duplicate project identity and create an opportunity for contradictory inputs. Passing only the scope would make a fixed implementation policy look caller-configurable.

The scanner must construct and publish the canonical scope in its discovery receipt, enumeration evidence, contextual inventory, and blocked partial-discovery evidence. A missing or unreadable directory must remain a typed blocked outcome, never a successful empty inventory.

## Trace findings retained as migration blockers

This contract correction alone does not complete the scanner migration. The current pipeline still reads `attributeScan.attributes`, while the v16+ complete judgment exposes `discoveryReceipt.files` and `contextualAttributeInventory`. The composition root still wires the old `scanAttributeAsts` implementation as contract v7, and the producer still returns `AttributeAst` instead of `AttributeProducerJudgment`. The legacy filesystem helper also treats a missing directory as an empty result and imports `semantic/relations`. These must be corrected before claiming the CLI path is compatible.

## Required migration order

1. Implement the scanner against the existing complete/blocked judgment ADT.
2. Construct one canonical `LaravelAttributeScanScope` from the supplied `SourceProjectIdentity` and use that exact scope in all result evidence.
3. Bind each enumerated file to its completed AST and contextuality evidence in `LaravelAttributeScannedFileSequence`.
4. Convert discovery, file-read, parse, and name-resolution failures into the existing typed blocker sequence.
5. Align `AttributeProducerInterface` and its implementation so missing constructors return a typed blocked judgment.
6. Update the pipeline to consume the receipt/inventory contract and preserve the blocked judgment.
7. Trace the CLI composition path and retire old subscanner imports only after all consumers are migrated.

## Verification status

This phase changes the upstream contract only. It does not claim that scanner implementation, pipeline wiring, TypeScript checks, or project build are complete. `npm run build` was not run.
