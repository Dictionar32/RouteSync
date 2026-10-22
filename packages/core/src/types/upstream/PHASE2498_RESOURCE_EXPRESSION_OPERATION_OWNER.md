# Phase2498 — Resource Expression Operation Owner

## Changes

- Reused `ResourceAstExpressionMappingOperationInterface<PhpAstValue>` as the existing operation contract.
- Moved `resolveAstValueToExpression` from `scanner/subscanners/resource` to `scanner/operations/resourceAstExpressionMapper.ts`.
- Preserved the exported operation name and `export const name: ExistingInterface` typing.
- Rewired the Resource producer, Resource field producer, response detector, and Resource binders to the operation owner.
- Updated audit scripts that referenced the old source path so they inspect the canonical implementation.

## Remaining semantic debt

- The mapper implementation still imports `semantic/relations`; this phase moves operation ownership but does not pretend that its semantic decisions have been migrated to a closed upstream judgment.
- `resourceProducer.ts` still imports `semantic/relations` and delegates model property production to `subscanners/model/propertyProducer.ts`.
- The operation interface still has positional `SyntaxValue` and optional string `sourceFile` parameters. A future contract evolution should use a named input/judgment only after tracing all callers and preserving source identity.
- No whole-project typecheck, build, Vitest, or CLI end-to-end result is claimed.
