# Phase 2033 — Assignment Target Evidence ADT, Interface First

## Trace finding

`ScannerAssignmentTargetInterface` depended directly on `RelationOption` for array-access evidence, member evidence, static-property evidence, and destructuring-pattern extraction. That made the canonical upstream contract speak in the legacy relation representation instead of a domain judgment.

## Change

- Introduced `AssignmentTargetEvidenceJudgment<Evidence>` with explicit `resolved` and `unresolved` variants.
- Migrated the canonical `AssignmentTargetQuery` evidence callbacks to this ADT.
- Updated `scannerAssignmentTargetContractAlgebra` to consume the typed `evidence` payload after narrowing on `kind`.
- Updated the scanner runtime boundary to adapt its existing expression classifiers to the canonical judgment contract.
- Kept `RelationOption` only in the deprecated compatibility facade so legacy consumers are not silently broken; the upstream interface no longer imports it.
- Updated the canonical interface test to use judgment variants.

## Authority flow

`Token evidence → AssignmentTargetQuery → ScannerAssignmentTargetInterface → AssignmentTargetJudgment → AST projection`

The runtime still supplies existing expression recognizers as evidence providers. It does not create a relation/foundation subscanner, and no new semantic authority is introduced downstream.

## Verification boundary

Run `npm run audit:phase2033-assignment-target-evidence-adt-interface-first` and the prior interface-first audits. These are structural checks; they do not replace a full TypeScript type-check or integrated test run.
