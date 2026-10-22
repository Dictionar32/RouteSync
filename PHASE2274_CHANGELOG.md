# Phase 2274 — Interface-first structural expression judgment

## Modified

- `packages/core/src/types/upstream/resourceSemanticMappingInterface.ts`
  - Strengthened the existing `ResourceSemanticMappingAuthorityInterface` structural mapping signature with explicit source-domain and target-domain unions.
  - No new V2 interface or generic wrapper.
- `packages/core/src/types/upstream/resourceSemanticMappingAlgebra.ts`
  - Structural mapping now returns a typed target vocabulary from the upstream declarative mapping table directly.
  - The structural mapping operation no longer invokes `semanticRewriteRuntimeExecutor` or converts a relation fact through `String(...)`.
- `packages/core/src/types/upstream/docs/PHASE2274_INTERFACE_FIRST_STRUCTURAL_EXPRESSION_JUDGMENT.md`
  - Records scope and remaining work.

## Trace findings

- Consumers are in `compiler/scanner/lexer/routeAst/phpAstExpressionMappings.ts`: arguments, member/method access, array entries/keys, assignment targets, destructuring entries, and static property owners.
- `resourceSemanticMappingAuthority.ts` wires the existing upstream authority into the exported consumer functions.
- CLI transitive closure is not proven by this bounded change; follow imports from CLI scanner entrypoints and verify the same authority is used end-to-end.

## Remaining issues (not claimed fixed)

- `resolveSemanticKind` still accepts and returns strings and still uses the semantic rewrite executor.
- Projection code still selects AST constructors/handlers using returned target discriminants. This is a follow-up boundary; this phase does not claim the whole projection is an executor-only path.
- `semantic/relations` remains used elsewhere in the expression pipeline. No claim is made that the entire route is free of it.
- `Attribute::make` requires a separate trace to identify the existing upstream semantic owner before changing it.

## Verification

- Archive source edits applied.
- Build and type-check were not run in this environment.
