# Phase2483 — Resource Operation Upstream Contracts

## Scope

This phase continues from Phase2482. It tightens ownership of Resource producer operations and removes direct `semantic/relations` / `semantic/foundation` imports from `laravelResourceScanner.ts` without relocating implementation files.

## Changes

- Added `types/upstream/resourceProducerInterface.ts` as the proper upstream owner for Resource producer inputs, results, producer operations, and the field-production callable.
- Kept `compiler/scanner/subscanners/resourceProducer.ts` and `compiler/scanner/subscanners/resource/resourceFieldProducer.ts` at their existing paths; their exported operations are now typed against upstream contracts.
- Removed the redundant `produce` operation from the Resource producer contract because the traced production consumers use `produceResult` and `produceField`.
- Added explicit upstream ADT folds for the already-closed `ResourceModelBindingOutcome` and the Resource batch-completeness judgment. These folds only eliminate judgments; they do not infer or change them. The binding authority now determines batch completeness before scanner projection, so the scanner no longer decides completeness by counting rejected artifacts.
- Reworked `laravelResourceScanner.ts` to consume the existing evidence inventory, project the already-closed binding judgment, and avoid direct relation/foundation helper imports.
- Updated the Resource binder to reference upstream producer contracts rather than importing the producer interface from its implementation module.
- Added a focused structural audit under `scripts/audits` and registered it in `package.json`.

## Validation

Run:

```sh
node scripts/audits/audit-phase2483-resource-operation-upstream-contracts.cjs
```

The audit verifies upstream contract ownership, scanner relation/foundation import removal, closed-judgment folding, single-inventory wiring, and absence of lexer-owned types from the upstream contract.

## Explicitly not complete

- `resourceProducer.ts` still imports relation utilities and remains under `subscanners`; only its contract ownership was migrated in this phase.
- `resourceSourceEvidence.ts` still imports relation utilities and remains under `lexer`.
- `resourceBinder.ts` still has relation/foundation dependencies and uses the legacy producer implementation.
- Other Laravel scanners still need their own consumer-by-consumer relation/foundation and runtime-operation audit.
- Full typecheck/build/Vitest/CLI end-to-end were not verified. The available global TypeScript compiler currently stops on existing syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts` and rejects the repository's ES2025 target/lib configuration.
