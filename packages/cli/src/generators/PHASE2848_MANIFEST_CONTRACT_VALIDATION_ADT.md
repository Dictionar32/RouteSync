# Phase 2848 — Manifest Contract Validation ADT Operations

## Runtime trace

`CLI scan -> route manifest projection -> manifestContractValidationOperations.validate(manifest) -> ManifestContractValidatedJudgment | ManifestContractRejectedJudgment -> continueWith(...) -> persist or preserve explicit rejection`.

The validator already had a named operations interface and a frozen runtime object. The gap was downstream: its validated/rejected result arms carried only data, so `scan.ts` and `ManifestGenerator.ts` re-dispatched on `kind`. Both ADT arms now own a typed `continueWith` operation bound by the producer. Consumers route outcomes through those domain handlers without adding a second switch or converting rejection to success-shaped output.

## Usage

```ts
const result = manifestContractValidationOperations.validate(manifest).continueWith({
  onValidated: judgment => ({ kind: 'ready' as const, manifest: judgment.manifest }),
  onRejected: judgment => ({ kind: 'blocked' as const, violations: judgment.violations }),
});
```

This is a concrete usage pattern over the implemented API. `ready` and `blocked` are caller-chosen result discriminants, not validator output kinds.

## Validation limits

Run `npm run audit:phase2848-manifest-contract-validation-adt`. It checks source structure and consumer migration only; it does not establish full project typecheck, test-suite, or CLI E2E success. `packages/core/src/types/upstream/collections.ts` remains empty.
