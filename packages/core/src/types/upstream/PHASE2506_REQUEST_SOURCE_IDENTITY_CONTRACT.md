# Phase2506 — Request Producer Source Identity Contract

## Trace and root cause

Phase2505 established `RequestProducerInput` as an upstream-owned named contract, but `sourceFile` was still a plain `string`. `FormRequestScanner` flattened the canonical source identity (`SourceFilePath`, structurally the upstream `SourceFile` value object) to its nested string before invoking the producer. The producer then recreated source identity in selected expression paths while passing strings to validation/lifecycle projection. This weakened the operation boundary: it carried a path, not the typed source identity already known upstream.

## Change

- `RequestProducerInput.sourceFile` now uses the existing upstream `SourceFile` value object; no duplicate source-file type was introduced.
- `FormRequestScanner` passes `source.sourceFile` intact.
- `requestProducer` projects the string path only at the implementation edge where existing parser helpers still require a path string.
- Existing `RequestProducerInterface` and `export const requestProducer: RequestProducerInterface` wiring are preserved.

## Verification

Run `node scripts/audits/audit-phase2506-request-source-identity-contract.cjs`.

## Explicitly open

This phase closes only source identity at the request producer boundary. `requestProducer.ts` still performs semantic decisions using `semantic/relations` and remains under `scanner/subscanners`. `RequestProducerInput` also still imports parser-specific evidence (`PhpArrayEntry`, `PhpMethodAst`, `PhpClassPropertyAst`) and concrete `TypeInterner`. These are real upstream ownership debts; this phase does not claim relation/foundation-free dependency closure, subscanner retirement, whole-project typecheck, build, or CLI end-to-end verification.
