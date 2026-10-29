# Phase 2849 — Manifest Serialization Continuations

## Runtime trace

`manifestGeneratorOperations.save(manifest, outputPath)` → `manifestContractValidationOperations.validate(manifest).continueWith(...)` → `manifestSerializationOperations.serialize(validatedManifest)` → `serialization.continueWith(...)` → either an explicit serialization rejection or persistence of the serialized manifest.

## Contract changes

- Serialization outcomes are now explicit `ManifestSerializationCompleteJudgment` and `ManifestSerializationRejectedJudgment` variants.
- Each terminal carries `continueWith`, whose handler contract is `ManifestSerializationHandlers<Result>`.
- The serializer producer binds each continuation to its own terminal judgment.
- Persistence consumes serialization outcomes through the continuation operation rather than a `switch` on `kind`.
- Serialization rejection and filesystem write rejection remain distinct outcomes.
- Runtime operation export remains interface-first: `manifestSerializationOperations: ManifestSerializationOperationsInterface = Object.freeze({...})`.

## Usage example

```ts
const result = manifestSerializationOperations.serialize(manifest).continueWith({
  onComplete: judgment => persistSerializedManifest(judgment.manifest),
  onRejected: judgment => reportSerializationFailure(judgment.message),
})
```

`persistSerializedManifest` and `reportSerializationFailure` above are illustrative consumer handlers, not exported RouteSync APIs.

## Verification scope

Run `npm run audit:phase2849-manifest-serialization-continuations`. This audit checks source structure and public contract wiring. It does not claim full TypeScript semantic typechecking, package build, tests, or CLI end-to-end execution.
