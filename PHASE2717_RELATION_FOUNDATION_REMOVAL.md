# Phase 2717 — Relation Foundation Removal

## Requested change
Remove the `relationFoundation` implementation modules and the ownership document. The user explicitly accepts resulting compile/runtime errors for this destructive intermediate step.

## Removed source files
- `packages/core/src/semantic/foundation/relationFoundation.ts`
- `packages/core/src/semantic/kernel/relationFoundation.ts`
- `packages/core/src/semantic/relations/relationFoundation.ts`
- `packages/core/src/semantic/foundation/PHASE949_RELATION_FOUNDATION_OWNERSHIP.md`

## Intentional breakage
Existing source files still import APIs from the removed modules. Those imports are deliberately not repaired in this phase because the instruction was to empty/remove the foundation first, accepting errors. This workspace is expected to fail typecheck/build until consumers are migrated to their real owning domain/semantic modules or existing upstream contracts.

## Scope and verification
This is a file-removal phase, not a claim that all relation semantics have been migrated. Search the workspace for remaining `relationFoundation` imports and remove them by migrating each consumer to existing, correctly-owned APIs. Do not introduce a replacement foundation, generic relation helper, parallel authority, or wrapper layer.
