# Phase 1803 — PHP Frontend Coverage Witness Interface-First

## Trace finding

The frontend extraction validator already bound the extraction, whole-file span, inventory, and invocation spans. It did not yet bind the frontend coverage witness's own source file/span to the extracted whole-file source, verify the complete-coverage obligation tuple at runtime, or reject an incomplete coverage result with an empty `missingEvidence` list.

## Interface-first change

- Advanced `PhpSourceFrontendExtractionValidationContract` to version 3.
- Added typed violations for coverage source-file mismatch, coverage span mismatch, incomplete complete-coverage obligations, and incomplete coverage without missing evidence.
- Validation now binds the coverage witness to the same whole-file source before any downstream inventory/name-resolution authority runs.
- Complete coverage must enumerate every declared obligation in the required order.
- Incomplete coverage must state at least one missing evidence obligation.
- Existing pipeline semantics remain unchanged: incomplete or rejected extraction stays blocked and cannot produce a successful integrated response.

## Scope limits

This phase improves the trust boundary for frontend evidence. It does not claim that the existing Laravel parser has been wired into `PhpSourceFrontendInterface`; the actual whole-file parser adapter and end-to-end invocation flow remain the next implementation step. No build or typecheck was run.
