# Phase 1804 — PHP Invocation Syntax Inventory Interface-First

## Trace finding

The frontend extraction used a raw `invocations` array while `coverage` separately claimed whole-file invocation coverage. That shape allowed the interface to express a complete coverage claim without requiring a closed, source-bound invocation inventory of its own.

## Interface-first change

- Evolved `PhpSourceFrontendContract` to version 2.
- Replaced `PhpSourceFrontendExtraction.invocations` with `invocationInventory`, a closed complete/incomplete union.
- The complete variant carries source identity, whole-file source span, entries, and the full invocation-inventory obligation tuple.
- The incomplete variant carries any discovered entries and a non-empty-by-validation list of missing invocation evidence obligations.
- Evolved the extraction validation contract to version 4.
- Added typed violations for source identity/span mismatch, incomplete inventory paired with complete coverage, malformed completeness obligations, and incomplete inventory without missing evidence.
- Validation now binds every invocation inventory entry and callee syntax to the same whole-file source.
- Pipeline authority consumes `invocationInventory.entries` only after complete validation; incomplete inventory remains a blocked frontend-coverage result.

## Ownership boundary

This phase evolves the existing frontend and validation contracts. It does not move runtime functions into interface files, does not add a parallel semantic subsystem, and does not wire the parser yet. Parser implementation and Laravel scanner wiring remain the next phase after the interface boundary is accepted.

## Verification

- `scripts/audits/audit-phase1804-php-invocation-syntax-inventory-interface-first.cjs`
- Static contract audit only; no build or typecheck was run.
