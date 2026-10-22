# RouteSync Phase 2488 — Resource Expression Mapping Contract

## Audit and trace

The Resource expression mapper was exported as a standalone function declaration from `scanner/subscanners/resource/resourceAstExpressionMapper.ts`. Its operation contract was implicit in the implementation module rather than explicitly owned by `types/upstream`. Multiple production consumers use this operation, including Resource producer/binder paths and controller response projection.

The syntax type is owned by the scanner's PHP parser, so the upstream contract must not import `PhpAstValue` or any scanner module. The contract therefore accepts a syntax-owner-supplied `SyntaxValue` type and returns the existing `ResourceExpressionModel`.

## Repair

- Added `ResourceAstExpressionMappingOperationInterface<SyntaxValue>` under `packages/core/src/types/upstream`.
- Changed `resolveAstValueToExpression` to `export const` with the explicit upstream operation interface.
- Exported the contract from the upstream barrel and public core entry point.
- Added `scripts/audits/audit-phase2488-resource-expression-mapping-contract.cjs` and registered `audit:phase2488-resource-expression-mapping-contract`.

## Important incomplete work

This phase closes the missing operation contract and connects the existing consumer-facing operation to it. It does **not** retire `resourceAstExpressionMapper.ts` from `subscanners`, and it does **not** remove that module's imports from `semantic/relations`. The Resource producer, field producer, binder, and source-evidence scanner also retain relation imports. No direct `semantic/foundation` import was added by this phase, but repository-wide absence is not claimed.

The next implementation must move AST expression semantics to the proper semantic authority only after identifying the existing AST ADT/fold owners, then replace relation/foundation imports through actual contract wiring rather than a file move or local duplicate algebra. Only after all production consumers use that authority should the legacy subscanner implementation be deleted.

## Verification boundary

- Phase2488 structural audit: 10/10 assertions passed.
- Phase2487 binary operator authority audit: 10/10 assertions passed.
- `package.json` JSON parsing passed.
- Full typecheck, build, Vitest, and end-to-end CLI were not run in this phase.

## Technical references

- TypeScript Handbook — Object Types: https://www.typescriptlang.org/docs/handbook/2/objects
- Laravel Eloquent API Resources: https://github.com/laravel/docs/blob/13.x/eloquent-resources.md
