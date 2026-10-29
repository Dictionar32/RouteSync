# Phase 1548 — Opaque Controller Semantic Authority Interface

## Why this is a model-level change

Phase 1547 moved controller-variable decisions out of the scanner, but the public `ControllerVariableSemanticAuthorityInterface` still exposed its `SemanticDecisionContract`. That leaked the executable rule catalog across the boundary and let consumers depend on the internal solver contract instead of the one authoritative resolution capability.

## Interface-first correction

- Removed `contract` from the public authority interface. Its only semantic capability is `resolve(request) -> ControllerVariableSemanticJudgment`.
- Kept the `SemanticDecisionContract` private to the authority implementation. The existing `semanticDecisionAlgebra` remains the only solver; no duplicate algebra was added.
- Declared `authority: 'upstream'` on `ControllerVariableSemanticRuntimeExecutorInterface` and its implementation so ownership is part of the runtime contract, not an undocumented convention.
- Updated the executor test double to satisfy the narrower public interface.
- Added a dedicated audit that checks the public contract does not leak solver internals, scanner code does not own semantic rules, and the concrete authority is bound only in the composition root.

## Resulting boundary

```text
AST shape
  -> scanner evidence adapter
  -> typed semantic request
  -> runtime executor interface (authority: upstream)
  -> opaque authority interface: resolve(request)
  -> private SemanticDecisionContract + existing SemanticDecisionAlgebra
  -> closed judgment with selected rule and evidence
  -> consumer projection
```

The public interface now describes **what semantic authority guarantees**, not **how the authority solves it**. This is the main contract-level improvement; scanner behavior and semantic rule inventory were intentionally not expanded in this phase.

## Verification

Run:

- `npm run audit:phase1548-controller-semantic-authority-opaque-interface`
- `npm run audit:phase1547-controller-variable-semantic-interface-first`
- `npm run audit:phase1546-interface-first-scanner-dependency-inversion`

Static audits establish architectural boundaries, not runtime correctness. A full build/test result must be reported separately based on the available dependencies.

## Wider trace findings (not silently claimed as migrated)

- `packages/core/src/types/upstream/semanticDataflowInterface.ts` already separates typed request/result contracts from the admission implementation and runtime composition. Reuse this boundary pattern instead of adding another generic solver.
- `packages/core/src/types/upstream/semanticDecisionInterface.ts` defines the reusable declarative rule/precedence contract. `controllerVariableSemanticAuthority.ts` should keep using `semanticDecisionAlgebra`; its rule catalog is now private behind the controller-specific authority interface.
- `packages/core/src/compiler/frontend/php/routeAst/semanticRewriteInterface.ts` is a migration frontier: despite its name, it contains term conversions and the executable `solveClosedSemanticRelations` function, while delegating to `semanticRewriteEngine.ts`. Related relation solver/program/theory files also remain under the scanner tree. This is still semantic execution inside the scanner subtree and must be traced as a separate interface-ownership migration; moving it requires checking imports and tests rather than merely renaming files.
- `packages/core/src/compiler/scanner/semantic/semanticEvidenceRelations.ts` calls AST evidence classifiers. This is acceptable only while it produces syntax/source evidence; any domain meaning inferred from those classifications belongs behind an upstream semantic authority interface.

Therefore Phase 1548 closes one concrete contract leak, not the entire scanner semantic-reasoning frontier. The next interface-first pass should trace consumers and import edges for the route-AST rewrite engine, then establish one canonical upstream contract before changing wiring.
