# Phase 2784 — Domain Intent Runtime Operation Object Closure

## Goal

Replace exported function declarations on the domain-intent runtime projection boundary with one explicitly typed, frozen operation object. This is a contract-shape change, not a new semantic/reasoning primitive.

## Runtime trace

```text
CLI hook/runtime source lowering
  -> domainIntentCapabilityRuntimeOperations.fromFrontend(manifest.frontend)
  -> frontend domains record/list validation
  -> domainIntentCapabilityRuntimeOperations.fromRuntimeConfig (private implementation)
      -> generic capability OR aggregate-collection capability
      -> incomplete aggregate-collection evidence returns undefined
  -> domainIntentCapabilityRuntimeOperations.referenceFromCapability (private implementation)
  -> closed DomainIntentCapabilityReference ADT
  -> JSON projection into generated runtime manifest
```

The three public operations are now declared by `DomainIntentCapabilityRuntimeOperationsInterface` and published as:

```ts
export const domainIntentCapabilityRuntimeOperations:
  DomainIntentCapabilityRuntimeOperationsInterface = Object.freeze({
    referenceFromCapability: domainIntentCapabilityReferenceFromCapabilityImpl,
    fromRuntimeConfig: domainIntentCapabilityFromRuntimeConfigImpl,
    fromFrontend: domainIntentCapabilitiesFromFrontendImpl,
  });
```

CLI usage:

```ts
domainIntentCapabilityRuntimeOperations.fromFrontend(manifest.frontend)
```

## Contracts preserved

- `DomainIntentCapabilityReference` keeps separate `aggregate_collection` and `generic` discriminants.
- Incomplete aggregate-collection configuration remains fail-closed (`undefined`); the emitter does not reconstruct missing operations or fields.
- Existing `semanticReasoningContract('evidence_resolution')` remains because it is part of the current capability contract. No new reasoning primitive was added.
- The upstream manifest builder still consumes the canonical route capability algebra and keeps AST/source-model blocked outcomes separate.
- `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes. This phase does not restore `Sequence`, replace it with arrays, or add a collection wrapper.

## Compatibility note

The former named function exports from `@routesync/core` are replaced by `domainIntentCapabilityRuntimeOperations`. Consumers should call the corresponding properties (`fromFrontend`, `fromRuntimeConfig`, or `referenceFromCapability`). Repository-wide direct call sites were migrated in this phase.

## Verification and limits

Run:

```bash
npm run audit:phase2784-domain-intent-runtime-operation-object
```

This is a structural contract audit. It does not establish a successful full TypeScript build, complete test suite, or CLI end-to-end execution. The intentionally empty collections module still has unresolved consumers elsewhere in the repository.
