# RouteSync Phase2500 — Resource Expression Operation Ownership

## Scope

Trace the active Resource/Source AST producer path from upstream contracts to the operations used by the scanner. This phase removes three implementation owners from `scanner/subscanners`, gives their operations upstream-owned interfaces, preserves source identity as a typed `SourceFile`, and rewires current consumers.

## Changes

1. Moved `scanner/subscanners/model/propertyProducer.ts` to `scanner/operations/propertyProducer.ts`.
   - Added upstream `PropertyProducerInterface<PropertyEvidence>` and `PropertyProducerInput<PropertyEvidence>` in `types/upstream/propertyProducerInterface.ts`.
   - The implementation exports `propertyProducer` as a value typed by that upstream interface; it no longer declares a local producer interface.
2. Moved `scanner/subscanners/expressionProducer.ts` to `scanner/operations/expressionProducer.ts`.
   - Added upstream `ExpressionProducerInterface`, `ExpressionProducerInput`, and `ExpressionFromPhpAstOperationInterface`.
   - `expressionFromPhpAst` is now an interface-typed operation object with a named input (`syntax`, `sourceFile`) and `project` operation; it no longer exposes a positional `(syntax, file)` function.
   - The existing `phpAstExpressionSemanticAuthority` remains the semantic authority; this phase does not duplicate it.
3. Moved `scanner/subscanners/expressionAstCanonical.ts` to `scanner/operations/expressionAstCanonical.ts`.
   - Added upstream `ExpressionAstFromPhpAstOperationInterface` and named input contract.
   - Canonical AST surface projection uses the existing PHP AST algebra rather than directly importing `semantic/relations`.
4. Updated consumers in Resource production, field production, assignment/request production, model relation facts, and source semantic production to use operation owners and `.project({ ... })` inputs.
5. Corrected `scanPropertyAsts` to use `relationProject` for one-property-to-one-`PropertyAst` mapping instead of `relationExpand`, whose contract requires each callback to return an array.
6. Exported the new upstream contracts from the upstream barrel and core entry.
7. Added `scripts/audits/audit-phase2500-resource-expression-operation-ownership.cjs` and updated historical audits whose source paths followed the moved owners.

## Verification

- Phase2500 operation-ownership audit: 14/14 assertions passed.
- Phase2499 named-input contract audit: 10/10 assertions passed.
- Phase2498 expression operation-owner audit: 11/11 assertions passed.
- Phase2497 field-operation closure audit: 9/9 assertions passed.
- Phase2496 producer-owner audit: 8/8 assertions passed.
- Phase2494 and Phase2495 field authority/output-shape audits: 10/10 each.
- Phase1429 expression projection audit: 10/10 after updating stale assertions to current owners.
- TypeScript syntax parse: all changed TypeScript files passed.
- Targeted TypeScript semantic diagnostics for the three migrated operation owners and their two upstream contracts: 0 using the available compiler with ES2024 standard library declarations.
- Relative imports in the changed source set resolve.

A full repository typecheck/build/Vitest/CLI run was not completed. The workspace has no installed `node_modules`; the configured `ES2025` library declaration is absent from the available global TypeScript installation, and whole-project/transitive diagnostics are not a valid clean-build signal in this environment.

## Open architectural debt — explicitly not closed

- `resourceAstExpressionMapper.ts` still contains direct `semantic/relations` imports and local AST-to-domain semantic mapping logic.
- `phpAstExpressionSemanticAuthority.ts` and `phpAstAlgebra.ts` retain transitive relation dependencies. Removing direct imports from the migrated operation files does **not** make the complete scanner path relation-free.
- `resourceProducer.ts` still reaches `subscanners/model/propertyProducer` only through historical docs/audits, but active source imports have been rewired; other subscanner owners, including assignment/request producers, remain active.
- The mapper's recursive helpers still accept positional syntax/source values and include a `<scanner>` fallback. Source provenance is not yet closed across every recursive path.
- `semantic/foundation` was not introduced by this phase, but the complete transitive Laravel scanner import graph has not been proven foundation-free.

The next root-cause task is to move Resource expression semantic judgment out of `resourceAstExpressionMapper.ts` into an existing upstream authority/closed judgment, then wire the operation to consume that judgment without semantic reclassification, fallback, or repair. Only after the complete import graph is traced should relation/foundation dependencies be retired.
