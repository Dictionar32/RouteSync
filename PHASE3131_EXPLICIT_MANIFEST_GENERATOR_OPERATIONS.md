# Phase 3131 — Explicit Manifest Generator Operations

## Scope

This phase applies the interface-first ADT rule to the active CLI manifest path:

`upstream manifest projection → CLI validation → serialization → persistence → scan/sync → generator operation`.

The result ADTs no longer expose a generic `continueWith` visitor on this path.
Each result owns a domain operation that preserves fail-closed behavior:

- `ManifestContractValidatedJudgment.requireValidManifest()`;
- `ManifestContractRejectedJudgment.requireValidManifest()` throws a typed rejection;
- `ManifestSerializationCompleteJudgment.requireSerializedManifest()`;
- `ManifestSerializationRejectedJudgment.requireSerializedManifest()` throws a typed rejection;
- `ManifestPersistenceCompleteJudgment.requireCompletePersistence()`;
- every persistence rejection exposes the same operation and throws a typed rejection.

The CLI commands call these operations directly. They do not inspect the ADT
discriminant, reconstruct rejection data, or install a generic visitor.

## Runtime trace

```text
source discovery / upstream manifest projection
  -> RouteManifest
  -> manifestContractValidationOperations.validate
  -> ManifestContractValidationJudgment.requireValidManifest
  -> manifestSerializationOperations.serialize
  -> ManifestSerializationJudgment.requireSerializedManifest
  -> filesystem persistence
  -> ManifestPersistenceJudgment.requireCompletePersistence
  -> scan/sync terminal output
  -> manifestCodeGenerationOperation.emit
  -> ManifestCodeGenerationBlockedOutcome.requireCompleteGeneration
```

The CLI remains the owner of manifest policy and filesystem output. Core
upstream types are not made dependent on CLI generator types. The existing
`RouteManifestProjectionCompositionResult` remains the upstream projection
boundary, and the code-generation operation continues to fail closed when no
verified `RouteManifest -> ContractIR -> IREmitter` producer is composed.

## Domain-model rule

An ADT in this path is not only a record of fields. Each variant exposes the
operation that is legal for that variant. A complete variant returns its
typed payload; a blocked variant rejects through a typed error carrying the
original judgment. This keeps provenance and terminal policy attached to the
producer instead of reclassifying the result in CLI flow code.

## Migration boundary

This is a bounded runtime-path migration. It does not mechanically delete
`string`, `number`, `undefined`, `null`, `boolean`, arrays, conditionals,
equality, casts, loops, `map`, `reduce`, or parser control flow. Those
constructs must be removed only when a domain ADT preserves their semantics
and source evidence. Repository-wide exported-function conversion remains a
measured frontier and requires domain-specific interfaces and caller migration
in separate batches.

## Verification

Run:

```sh
npm run audit:phase3131-explicit-manifest-generator-operations
```

The audit is static and records the remaining repository export inventory. It
does not claim full typecheck, full tests, or PHP → CLI → manifest → generator
end-to-end success.

## External language/framework grounding

PHP enums provide closed sets of object cases, and PHP type declarations make
parameter and return contracts explicit. PHP `match` is exhaustive and value
producing, but it is still a language construct rather than a justification
for erasing scanner control flow. Laravel route model binding and Form Request
validation provide source-level evidence for typed route parameters and
validation ownership; the scanner should preserve those facts as ADT evidence
and provenance rather than infer them from primitive output strings.
