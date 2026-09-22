# Interface Trace Audit — Phase 57

## Scope

Interface/ADT contract correction only. Consumer flow, scanner flow, lowerers, and generated output are intentionally not migrated in this phase.

## Changes

1. `ScannedResourceFieldParams.semanticType` now requires `SemanticType`.
2. `ScannedResourceFieldDescriptor` stores `SemanticType` directly. No `PrimitiveKind` compression and no string-to-primitive conversion occur at this interface boundary.
3. `ScannedResourceFieldDescriptor` no longer stores a duplicated `nullable` state. Nullability belongs to `SemanticType`.
4. `ObjectProperty` no longer exposes duplicated `nullable` state.
5. `ScannedObjectPropertyParams` no longer accepts duplicated `nullable` state.
6. Added type-level regression tests for the interface contracts.

## Intent

The interface must be capable of carrying the semantic model discovered upstream. A primitive-only contract would force downstream reclassification or reconstruction.

Expected direction:

`PHP AST → semantic resolver → SemanticType → ResourceFieldDescriptor → downstream`

This phase stops at the interface boundary.

## Verification

Full project tests/build were not run because the source snapshot does not contain `node_modules`. The added tests are contract tests and have not been executed in this environment.
