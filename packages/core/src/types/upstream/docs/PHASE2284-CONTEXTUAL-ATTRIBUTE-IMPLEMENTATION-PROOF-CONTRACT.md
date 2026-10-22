# Phase 2284 — Contextual Attribute Implementation Proof Contract

## Trace finding

Phase 2283 aligned the attribute-scanner output and controller-scanner input, but the inventory still treated `AttributeAst.definition.contextual` as sufficient authority. The producer in `compiler/scanner/subscanners/attributeAstCanonical.ts` derives that boolean with a short-name regex over source text. A class can import/alias an interface, declare a namespaced interface, or contain unrelated text; a boolean does not preserve which interface identity was resolved or where its implementation was declared.

## Interface-first correction

Evolve the existing `LaravelAttributeScannerInterface` contract from version 3 to version 4. The existing contextual declaration evidence now requires a `LaravelContextualAttributeImplementationProof` that carries:

- the canonical Laravel contract identity `Illuminate\\Contracts\\Container\\ContextualAttribute`;
- the complete `PhpClassNameResolution` success judgment, including its resolved qualified name and rule;
- the canonical qualified identity of the declared attribute class, alongside the short `ClassName` retained for existing dependency consumers;
- the source span of the implemented interface.

The inventory cannot be represented as proven contextual declarations using only `AttributeAst.definition.contextual`, a short class name, or a regex result. Version 4 retains the resolved-name judgment rather than reducing it to `resolutionRule`, and records the declaration’s canonical qualified identity separately from its short consumer key. The type contract makes both pieces of evidence available; the producer authority must still establish that the resolved interface identity equals the canonical Laravel contract before publishing a proof. The existing `LaravelContextualAttributeInventory` remains the sole inventory type consumed by `LaravelControllerScannerInterface`; no duplicate scanner interface is added.

## Scope boundary

This phase is contract-only by design. It does not change `attributeAstCanonical.ts`, source pipeline wiring, or runtime classification. Those producers do not yet satisfy the strengthened version-4 proof contract and must be migrated in the next phase by consuming parsed interface evidence and the existing PHP class-name resolution authority. This mismatch is intentional and means a TypeScript typecheck is expected to remain blocked until that follow-up is implemented. No build/typecheck was run.

No imports from `semantic/foundation` or `semantic/relations` were added to upstream contracts.
