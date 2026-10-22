# RouteSync Phase2450 — Laravel Scanner Interface-First Boundary

## Scope

This phase continues from Phase2449's blocked audit. It makes one real upstream ownership change and records the remaining blockers rather than claiming full retirement.

## Implemented

`types/upstream/resourceModelBindingSemanticInterface.ts` now owns the rule syntax used by its semantic rule set:

- `ResourceModelBindingRuleVariable`
- `ResourceModelBindingRuleTerm`
- `ResourceModelBindingRulePattern`
- `ResourceModelBindingSemanticRule`

The upstream rule contract no longer imports `SemanticRelationRewrite`, `SemanticRelationPattern`, or `SemanticRelationVariable` from `semantic/relations/semanticRewriteEngine`. This removes an implementation-type dependency from the upstream contract. The rule data remains structurally consumable by the existing executor during migration.

## Still blocked

1. `compiler/scanner/upstream/routeDeclarationComposition.ts` still imports `controllerReturnSemanticFromValues` from `compiler/scanner/subscanners/controller/controllerAstCanonical.ts`. The closure-return judgment producer has not yet been migrated to its proper upstream semantic owner. Do not replace it with an `absent` judgment or simply relocate the same implementation.
2. `compiler/semantic/resourceModelBindingAuthority.ts` still imports the relation fact type and relation helper operations. `types/upstream/semanticRewriteAuthority.ts` still executes via `semantic/relations`. The type-only change above does not remove the runtime engine dependency.
3. `semantic/foundation` and `semantic/relations` cannot safely be deleted while these paths remain.
4. `LaravelRouteScanOperationInterface.execute()` remains parameterless, but parameterless execution alone does not prove that all semantic reasoning is upstream-owned.

## Verification

Run:

```bash
node scripts/audits/audit-phase2450-laravel-scanner-interface-first-boundaries.cjs
```

The audit is expected to return `blocked` while the listed dependencies remain. A blocked result is intentional evidence that the migration is not complete; it must not be changed to pass by weakening the scan or hiding imports.

This phase has not run the full project typecheck, package build, Vitest suite, or CLI end-to-end test.
