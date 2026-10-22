# Phase 2084 — Upstream-Owned Controller Ancestry Evidence

## Scope

This phase strengthens the existing `ControllerDeclarationSemanticSelection` contract in place. It does not add a new semantic folder, a parallel authority, or a replacement scanner.

## Contract change

`ControllerDeclarationSemanticSelection` now carries `inheritedDeclarations`. Each `ControllerDeclarationAncestorEvidence<TAttribute>` binds one resolved ancestor to its exact `sourceFile`, canonical `classIdentity`, controller identity, and middleware attributes owned by that declaration.

The existing `inheritedControllerNames` and flattened `inheritedMiddlewareAttributes` remain for compatibility. The scanner now derives the names it forwards to action projection from `inheritedDeclarations`, so the chain consumed downstream comes from the identity-bearing semantic evidence rather than the older name-only projection.

The evidence is preserved for both `complete` and `blocked` ancestry outcomes. If an ancestor is resolved but a more distant parent cannot be resolved, the judgment retains the exact resolved prefix while the `ancestryTermination` continues to block executable action selections. This prevents a blocked closure from erasing known provenance or pretending that the whole chain is complete.

## Trace

```text
ControllerDeclarationSemanticCandidate inventory
  -> declaration authority resolves canonical parent identities
  -> ControllerDeclarationSemanticSelection
       complete: inheritedDeclarations + actionSelections
       blocked: inheritedDeclarations + ancestryTermination; no actionSelections
  -> Laravel scanner projects inherited controller identities from inheritedDeclarations
  -> existing action / integrated response / AST projection flow
```

## Static audit

Run from the repository root:

```sh
node scripts/audits/phase2084-controller-ancestry-contract.mjs
```

Result at archive creation: 8/8 static contract assertions passed. Four architectural gaps are intentionally reported, not hidden:

- Laravel scanner still imports `semantic/relations`.
- Laravel scanner still calls `scanControllerAction`.
- Declaration authority still contains imperative helper functions.
- Laravel scanner still uses `LaravelControllerScannerExecutor` class.

## Verification limits

No project build, TypeScript typecheck, or Vitest run was performed in this phase. The new regression test is source-added but not runtime-verified. The static audit verifies text-level contract integration only; it is not a substitute for compilation or test execution.

## Next contract-first step

Evolve the existing action contract around `resolveControllerActionContract` only after tracing its nested response, request, dataflow, schema, and dependency outcome types. The next contract must correlate the action's source identity and semantic subjudgments rather than wrap the current resolver in a superficial `complete` variant. Then migrate all consumers before retiring `scanControllerAction` or relation dependencies.
