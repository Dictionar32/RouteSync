# Phase 2501 — Resource Expression Semantic Authority Boundary

## Changes

- Evolved the existing `resourceAstExpressionMappingInterface.ts` contract with `ResourceAstExpressionMappingAuthorityInterface`; the previous operation interface remains the runtime-facing boundary.
- Moved Resource-specific expression interpretation from `operations/resourceAstExpressionMapper.ts` into `compiler/frontend/php/routeAst/resourceExpressionSemanticAuthority.ts`, the PHP route-AST semantic owner.
- Reduced `operations/resourceAstExpressionMapper.ts` to a typed `export const` adapter that delegates the named input to the authority.
- Removed the authority's implicit `'<scanner>'` source-file defaults and propagated the supplied source identity through recursive expression mapping helpers.
- Exported the new authority contract through the public core entry.
- Added exhaustive PHP AST eliminators for array keys and static-property owners, then used them in the Resource expression authority instead of relying on unrefined relational equality checks.
- Corrected the Resource binary-operator contract to accept the actual closed operator-kind vocabulary emitted by the Laravel PHP AST frontend. The judgment table now handles `greater_or_equal` and `less_or_equal` explicitly and preserves unsupported `bitwise_or` as `unknown`.

## Ownership chain

`PhpAstValue + SourceFile → ResourceAstExpressionMappingAuthorityInterface → resourceAstExpressionMappingAuthority → ResourceAstExpressionMappingOperationInterface adapter → existing consumers`

The authority returns the existing `ResourceExpressionModel`, whose semantic result is already a closed union (`known`, `requires_binding`, `rejected`). No parallel result ADT was added.

## Explicitly open debt

- The authority implementation still imports `semantic/relations`. This phase makes the dependency explicit at the semantic authority boundary; it does **not** claim relation-free execution.
- No `semantic/foundation` import was found in the new authority, but a repository-wide or transitive foundation-free proof was not run.
- Some consumers still manufacture `SourceFile('<scanner>')`; the authority no longer silently invents that value internally, but end-to-end provenance must still be propagated from each consumer's actual source evidence.
- Resource closure projection explicitly throws for `while`, `switch`, `unset`, and `include` statements because the current `ResourceClosureStatement` ADT cannot represent them. This is surfaced rather than silently misclassified, but should be replaced by an explicit closed unsupported judgment in a later contract evolution.
- The strict targeted TypeScript invocation reports no diagnostics in the changed authority, operation adapter, or operator contract/authority files. The transitive TypeScript program still reports 200 diagnostics in other existing project files, so this is not a clean whole-project typecheck.
- Full project typecheck, package build, Vitest, and CLI end-to-end validation were not run.

## Verification

Run `node scripts/audits/audit-phase2501-resource-expression-semantic-authority.cjs` and the relevant Phase 2487–2499 audits. Syntax and relative import checks are structural checks, not a replacement for full TypeScript validation.
