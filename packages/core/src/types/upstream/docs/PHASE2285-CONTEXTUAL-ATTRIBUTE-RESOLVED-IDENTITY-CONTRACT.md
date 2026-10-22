# Phase 2285 — Contextual Attribute Resolved Identity Contract

## Trace finding

Phase 2284's `LaravelContextualAttributeImplementationProof` retained only `resolutionRule`. That discards the `qualifiedName` from the existing `PhpClassNameResolution` judgment, so the proof could not carry the actual resolved interface identity that is necessary to distinguish an imported/aliased `Illuminate\\Contracts\\Container\\ContextualAttribute` from a same-short-name interface in another namespace.

The current controller scanner projects `declaration.identity` into `readonly ClassName[]`. That short key remains needed by the existing dependency consumer, but it is not a globally canonical PHP class identity. The upstream inventory must preserve the qualified identity too rather than pretend the short name is sufficient.

## Interface-first correction

Evolve the existing `LaravelAttributeScannerInterface` from contract version 3 to 4:

- replace `resolutionRule` with the complete successful `PhpClassNameResolution` judgment;
- retain the declared attribute's `PhpQualifiedClassName` alongside its existing short `ClassName` consumer key;
- retain the canonical Laravel contract identity and the interface source span;
- keep `LaravelContextualAttributeInventory` as the single inventory contract consumed by `LaravelControllerScannerInterface`.

No second resolver, scanner interface, generic wrapper, or runtime implementation is introduced.

## Important semantic boundary

The stronger type preserves the evidence needed to verify identity; it does not magically prove that the resolution's `qualifiedName` matches the canonical Laravel contract. The attribute producer must publish `LaravelContextualAttributeImplementationProof` only after that equality has been established from parsed interface evidence and the existing `PhpClassNameResolutionRuleInterface`. The short-name regex in `attributeAstCanonical.ts` remains legacy debt and is not considered a valid proof producer.

## Scope and validation

This phase is upstream-contract-only. It does not alter scanner runtime or wiring. Consequently, existing producers do not yet satisfy version 4 and a project typecheck is not claimed. The static audit checks contract shape and records the still-open producer mismatch. No imports from `semantic/foundation` or `semantic/relations` are added to upstream contracts.
