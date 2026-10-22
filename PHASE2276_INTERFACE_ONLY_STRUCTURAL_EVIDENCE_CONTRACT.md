# Phase 2276 — Interface-only structural evidence contract

## Scope

This phase changes exactly one source file: `packages/core/src/types/upstream/resourceSemanticMappingInterface.ts`. No implementation, algebra, lexer, scanner, subscanner, wiring, test, or CLI file is changed.

## Trace finding

The existing structural operation accepted `prefix` and `kind` as independent arguments. That permits combinations which do not represent a valid structural domain (for example, a literal prefix combined with an assignment-target kind) to cross the authority boundary. The upstream interface should describe valid evidence as one closed discriminated union.

## Contract change

`ResourceStructuralMappingInput` closes the valid prefix/source-kind pairs by structural domain. `resolveStructuralKind` now accepts this contract as one value rather than two independently supplied values. The `named` source variant is included for the existing `parameter_type_named` mapping.

## Deliberately not wired in this phase

This is an interface-first phase only. Existing implementation and call sites have intentionally not been adapted. Consequently, this ZIP is a contract proposal stage and is not claimed to type-check or build until a later wiring phase updates the upstream implementation and its consumers.

## Constraints honored

- No V2 interface or generic wrapper added.
- No `semantic/foundation` dependency added.
- No implementation or runtime changes.
- No subscanner files emptied or deleted in this interface-only phase.

## Acceptance criteria for the next phase

1. Update the existing upstream implementation to consume `ResourceStructuralMappingInput`.
2. Migrate all callers to construct the matching discriminated variant.
3. Verify there is no remaining two-argument structural mapping call.
4. Trace lexer/scanner → upstream authority → IR → CLI.
5. Empty obsolete subscanner implementations only after all active consumers are migrated.
6. Run targeted tests and type-check in the project's supported environment.
