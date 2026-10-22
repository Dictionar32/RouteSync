# Phase 1882 — Laravel Controller Variable Semantic Projection, Interface First

## Trace finding

`controllerAstCanonical.ts` contained a scanner-local `semanticRules` table that translated `ControllerVariableSemantic` variants (`model_origin`, `request_origin`, `expression`, and `external`) into `SemanticValue`. The canonicalizer selected `ControllerVariableDefinition.semantic`, even though each definition already retained the upstream `semanticResolution` judgment produced by `ControllerVariableSemanticAuthorityInterface`.

That meant the canonicalizer had a second interpretation point after the upstream semantic authority.

## Interface-first change

Added upstream-owned contracts:

- `ControllerVariableSemanticValueProjectionAuthorityInterface`
- `ControllerVariableSemanticValueProjectionJudgment`
- `controllerVariableSemanticValueProjectionAuthority`

The projection judgment is closed, retains the exact source judgment, distinguishes a projected result from `contract_violation`, preserves the violation reason, and represents a missing source judgment explicitly. Controller `ResolvedExpression` carries the projection judgment as a typed generic extension so the canonicalizer does not discard the closed outcome; other expression producers retain their existing shape. Semantic-to-expression-vocabulary mapping now lives at the upstream owner.

`controllerAstCanonical.ts` now selects `ControllerVariableDefinition.semanticResolution` and delegates the projection to the upstream authority. The local `SemanticRule` table and duplicated model/request/expression/external mapping have been removed.

## Existing directory state preserved

The following previously emptied files remain zero bytes:

- `packages/core/src/compiler/scanner/subscanners/controller/actionVariableTracker.ts`
- `packages/core/src/compiler/scanner/subscanners/controller/controllerErrorDetector.ts`

This phase does not claim the whole controller subscanner directory is empty. `controllerAstCanonical.ts` and other modules remain present; they require their own consumer trace and ownership migration.

## Verification

- Phase 1882 focused static audit: 16/16.
- Phase 1881 audit: 11/11.
- Phase 1880 audit: 11/11.
- Phase 1879 audit: 11/11.
- Phase 1878 audit: 10/10.
- Total selected static checks: 59/59.
- Audit script syntax and `package.json` JSON parsing passed.
- ZIP integrity checked after packaging.
- Full build and TypeScript compilation were not run.

## Domain references

- TypeScript narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing
- Laravel routing and controller action relationships: https://laravel.com/framework/docs/13.x/routing

These references inform the type-modeling and Laravel domain boundary; they do not verify compilation or runtime correctness of RouteSync.

## Next interface-first trace

Trace consumers of `controllerAstCanonical.ts` and its remaining semantic projection responsibilities. Migrate each semantic rule to its actual upstream owner before deleting or emptying the canonicalizer. Do not relocate scanner-local logic without changing ownership and the closed contract.
