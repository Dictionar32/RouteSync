# Error Repair Checkpoint 01 — AST + SemanticType Boundary

## Status
Partial — AST export fix completed; compatibility SemanticType repair remains pending.

## Root causes fixed
1. `compiler/ast/index.ts` re-exported `ASTNodeId` from `ASTNodeData`, although `ASTNodeData` only imported it. The canonical owner is `compiler/utils/Arena.ts` and `compiler/utils/index.ts`.
2. `compiler/compatibility/boundary/legacyResolver.ts` imported removed/non-canonical `types/ResolvedSemanticType` and `types/semantic` paths.
3. Legacy primitive resolution still compared the new `SemanticType` ADT against free strings. This item is now repaired against the active `ResolvedPrimitiveType` class hierarchy.

## Repair
- `ASTNodeId` is re-exported from the existing utility SSOT.
- `ResolvedSemanticType` is imported from `types/ir/resolvedSemanticTypes`.
- `SemanticType` is imported from `compiler/types/SemanticType`.
- Legacy primitive conversion now consumes `PrimitiveType` + `PrimitiveKind` explicitly.
- `file` is rejected explicitly because the legacy primitive contract has no equivalent.
- No string-to-semantic cast or `any`/`unknown` fallback was introduced.

## Verification
`ASTNodeId` export is structurally corrected. Compatibility resolver is now aligned to the active class-based resolved-type hierarchy; full verification remains pending because the legacy boundary still imports a removed compatibility barrel.

## Next root cause
Finish the legacy compatibility barrel (`compiler/types/ResolvedSemanticType`) and its `ContractInputBoundary` object construction before moving to `ResourceFieldFlattener` contract drift: old `semanticType`/`nullable` access and old `ResourceExpressionFieldModel` input are mixed with the newer `ResourceFieldDescriptor` contract.
