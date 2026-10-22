# Phase 2277 — Interface-First Structural Input Coherence

## Scope

This phase corrects the contract/implementation/call-site mismatch introduced when `ResourceSemanticMappingAuthorityInterface.resolveStructuralKind` changed to a single discriminated input object.

## Changes

- `resolveResourceStructuralKind` now accepts `ResourceStructuralMappingInput`, matching the upstream authority interface.
- The expression mapper now passes typed object inputs for arguments, access modes, array entries/keys, assignment targets, destructuring entries, and static property owners.
- The phase 1635 authority test now calls the same single-object contract.
- No new generic, union variant, dependency, `semantic/foundation` import, or relation/foundation replacement was added.

## Important limits

This is a coherence fix, not completion of the semantic architecture migration.

- `resourceSemanticMappingAlgebra.ts` still builds a string key and uses `semantic/relations` lookup to select a target kind. That remains a follow-up ownership issue; changing the input shape alone does not make runtime mapping an interface-only executor.
- `phpAstExpressionSemanticAuthorityInterface` remains generic over `Evidence`. Removing that generic safely requires establishing a canonical evidence type owned upstream. Importing scanner-owned `PhpAstValue` into upstream would reverse dependency direction, while inventing a second AST would duplicate the source model. This phase intentionally does neither.
- `phpAstExpressionMappings.ts` still uses handler tables and relation helpers. This phase does not claim that semantic reasoning has been removed from that mapper.
- Resource consumers that depend on both `Expression` and `DomainExpressionModel` remain to be traced before the old representation can be retired.

## Verification

Static search confirms all calls to `resolveResourceStructuralKind` use the one-object signature and the phase 1635 test uses the same contract. A TypeScript typecheck/test run was not performed because this extracted source tree has no local `node_modules/.bin/tsc`.

## Next upstream decision

The next substantive phase should establish the canonical PHP expression evidence ownership boundary, then evolve the existing `PhpAstExpressionSemanticAuthorityInterface` to a non-generic contract using that canonical type. Do not use `unknown`, `any`, or a duplicate scanner AST to force the generic away.
