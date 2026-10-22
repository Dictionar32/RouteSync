# Phase 2292 — Contextual Implementation Proof as Inventory Member (Interface First)

## Scope

This phase changes only the existing upstream Laravel attribute scanner contract, its contract documentation, and a structural audit. Producer implementation, scanner behavior, pipeline wiring, CLI, and runtime are intentionally untouched.

## Gap found in Phase 2291

`LaravelContextualAttributeImplementationProof` independently carried both a canonical `resolution` and a `declaration`. Although each field was individually typed, TypeScript did not encode that they came from the same `LaravelAttributeResolvedInterfaceEvidence` inventory member. A malformed producer could therefore pair the declaration of one `implements` entry with the resolution of another entry while satisfying the field types.

## Contract change

The existing `LaravelAttributeScannerInterface` is evolved in place from contract version 9 to version 10. The contract introduces `LaravelContextualAttributeResolvedInterfaceEvidence`, a specialization of the existing linked declaration/resolution evidence whose resolution is narrowed to the exact canonical identity `Illuminate\\Contracts\\Container\\ContextualAttribute`.

`LaravelContextualAttributeImplementationProof` now carries one `interfaceEvidence` member instead of independent `declaration` and `resolution` fields. The proof therefore keeps source spelling, source provenance, and resolved identity bundled in one evidence object. No parallel scanner interface, generic wrapper, or duplicate authority is introduced.

The producer still has the responsibility to establish that this member belongs to the full closed inventory; a structural TypeScript type alone cannot prove collection membership or source-order exhaustiveness. If any declaration cannot be resolved, the scan must use the existing blocked judgment rather than publish a complete inventory.

## Trace and integration boundary

The known CLI path remains:

`packages/cli/src/commands/scan.ts` → `controllerInvocationManifestComposition.ts` → `laravelSourceAstPipeline.ts` → `LaravelAttributeScannerInterface.scan(...)` → `attributeAstCanonical.ts` → contextuality judgment → complete inventory → controller scanner.

This is intentionally an interface-only phase. The producer still uses the older evidence shape and advertises its earlier contract version; pipeline wiring is not migrated here. `attributeProducer.ts` still imports `semantic/relations`. These are explicitly recorded as migration debt, not claimed as fixed. No dependency on `semantic/foundation` is introduced.

## Validation

The Phase 2292 audit validates the stronger proof-to-inventory-member contract, version synchronization, absence of forbidden upstream imports, and the intentional producer/wiring mismatch. This structural audit is not a TypeScript typecheck or build.
