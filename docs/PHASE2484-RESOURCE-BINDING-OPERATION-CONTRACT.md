# Phase 2484 — Resource Binding Operation Contract

## Audit and trace

The active Resource scan path is `resourceSourceEvidence` → `laravelResourceScanner` → `resourceModelBindingAuthority` → `resourceProducer` → integrated scan judgment. The scanner entry itself is already an interface-typed `export const`, and the binding batch's completeness is decided upstream. The remaining legacy binder path is separate: `SemanticResourceBinder` exports `bindResourceDefinition` from `compiler/scanner/binders/resource/resourceBinder.ts`.

Before this phase, `bindResourceDefinition` was an exported function with its entire parameter shape embedded in the implementation module. That meant callers could derive the call shape from an implementation symbol rather than an upstream operation contract.

## Change

- Added `types/upstream/resourceDefinitionBindingInterface.ts` with an explicit Resource binding input shape and named operation contract.
- Changed `bindResourceDefinition` to `export const bindResourceDefinition: ResourceDefinitionBindingOperationInterface = ...`.
- Changed the two exported boundary helpers in the same module from function declarations to typed const operations.
- Moved the `ResourceModelKnowledgeDataFlow` payload shape to an upstream-owned interface file; the legacy producer now re-exports that type rather than owning the contract.
- Exported the new contracts through both the upstream barrel and core public entry point.

## Root causes still open (not claimed as fixed)

This phase does **not** complete Laravel scanner retirement. `resourceBinder.ts` still imports `semantic/relations` and the legacy `subscanners/resourceProducer`; `resourceProducer.ts`, `resourceFieldProducer.ts`, and `resourceSourceEvidence.ts` also retain relation imports, and the producer implementation remains under `subscanners`. Those are semantic ownership issues, not import-format issues: replacing relational operators with ad-hoc branches or moving the files alone would merely relocate the same reasoning.

The next root-level change must close producer/binder judgments at the upstream authority boundary, wire the existing contracts into the CLI path, then remove the old subscanner dependency only after all consumers use the authoritative operation. `semantic/foundation` must remain absent from this path.

## Verification boundary

The phase audit verifies the new upstream contract, the typed const operation, public exports, and the known legacy blockers. Syntax transpilation is not a substitute for full typechecking. Full build, Vitest, and CLI end-to-end are not claimed as passed.
