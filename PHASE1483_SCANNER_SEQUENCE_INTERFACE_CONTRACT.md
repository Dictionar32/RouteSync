# Phase 1483 — Scanner Statement Sequence Interface Contract

## Scope

This phase formalizes the existing statement-sequence boundary as a public upstream interface without changing the runtime parsing behavior or reintroducing legacy scanner authority.

## Changes

- Added `packages/core/src/types/upstream/scannerStatementSequenceInterface.ts`.
- Moved `StructuredStatementResult`, `StatementSequenceContract`, and `StatementSequenceResolution` into the interface module.
- Made `scannerStatementSequenceAlgebra` implement `ScannerStatementSequenceInterface` by type alias, so the algebra implementation is checked against the canonical interface.
- Preserved legacy type imports from `scannerStatementSequenceAlgebra.ts` to avoid unnecessary consumer churn.
- Exported the interface, contract types, and canonical algebra from `types/upstream/index.ts`.
- Clarified contract ownership: sequence algebra owns cursor progress and validates boundary partitions; callbacks may construct AST nodes but must not replace boundary reasoning.

## Architecture boundary

`Source tokens -> statement boundary judgment -> sequence contract/algebra -> closed sequence resolution -> scanner AST construction -> downstream projection`.

The interface does not claim that all AST construction has moved into algebra. AST node creation remains runtime work; semantic boundary partitioning and progress validation remain canonical algebra responsibilities.

## Validation

- Static source inspection confirms the runtime still calls `scannerStatementSequenceAlgebra.parse` and the algebra is typed against the new interface.
- `tsc --noEmit -p tsconfig.json --pretty false` could not validate the project because this archive has no installed dependencies and the available global TypeScript is 5.8.3, while the project declares TypeScript 7.0.2. Missing standard library/type packages and unsupported TS7 compiler options prevent a meaningful project typecheck.
- Vitest and package build were not run because dependencies are not installed in this workspace.

## Remaining work

The next substantive migration is to replace the structured-statement callback's `RelationOption` ambiguity with an explicit closed judgment (`not_applicable | resolved | malformed | contract_violation`) so a failed structured parse cannot silently fall through to simple-statement AST construction. That change requires updating structured statement rules and regression tests together; it is intentionally not smuggled into this interface-only phase.
