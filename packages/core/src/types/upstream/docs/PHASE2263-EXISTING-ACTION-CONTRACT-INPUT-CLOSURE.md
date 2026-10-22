# Phase 2263 — Existing Action Contract Input Closure

## Trace

The production action semantic judgment authority still invokes `resolveControllerActionContract`. That resolver consumed optional constructor-parameter and contextual-attribute inventories, then silently replaced absent inventories with empty arrays. This weakened an existing contract: absence of supplied evidence was indistinguishable from a proven empty inventory.

## Change

Phase 2263 evolves the existing `ControllerActionContractResolverContext`; it does not introduce a parallel interface. Constructor parameters and contextual attribute names are now required inputs. The resolver consumes those exact inventories and no longer invents empty evidence through nullish fallback. Existing test fixtures now state empty inventories explicitly. The legacy `actionScanner` adapter may still provide defaults at its compatibility edge, but the resolver boundary itself is closed.

## Scope and remaining debt

This closes an input-contract ambiguity, not the full semantic ownership migration. `resolveControllerActionContract` remains on the production path and still composes resource judgments, dependency products, schema judgment, and return products. Subscanner retirement and transitive `semantic/relations` removal are not claimed complete. The next substantial change must evolve the existing `LaravelControllerActionSemanticJudgmentInterface` and its production authority so the canonical action judgment is composed from already-closed upstream judgments, with legacy resolver use reduced to consumer projection only before eventual retirement.

## Verification

`audit-phase2263-existing-action-contract-input-closure.cjs` checks the required fields, removed fallback, exact inventory consumption, explicit test fixtures, and absence of direct `semantic/foundation` / `semantic/relations` imports in the edited resolver. This static audit is not a substitute for typechecking or tests.
