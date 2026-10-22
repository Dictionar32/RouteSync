# Phase 2085 — Controller Ancestry Lattice / Fixed-Point Contract

## Scope

This phase evolves the existing declaration semantic judgment contract in place. It does not move folders, add a parallel semantic authority, or claim that the whole Laravel scanner is free of relation imports or controller subscanners.

## Source changes

- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts`
  - Adds `ControllerDeclarationAncestryClosure`, a discriminated certificate for complete and partial ancestry closure.
  - A complete closure certifies a least fixed point over the finite set of canonical class identities.
  - A blocked closure certifies only the least fixed point over resolved inventory evidence. It explicitly does not imply that external or unresolved ancestry is complete.
  - Correlates the closure certificate with the existing `complete` / `blocked` declaration selection variants; the prior `ancestryTermination` field remains for compatibility.
- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts`
  - Replaces recursive ancestry walking with iterative monotone expansion of the seen canonical ancestor identities.
  - Records closure rounds and the count of known ancestor declarations.
  - Preserves prior behavior for exact class identity, ambiguous inventory matches, unresolved parent names, external parents, and cycle detection.
  - Does not add a repeated ancestor to the inherited-name chain when a cycle is found.
- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.phase1968.test.ts`
  - Adds certificate assertions for complete ancestry, partially resolved ancestry, and inheritance cycles.
- `scripts/audits/audit-phase2085-controller-ancestry-fixed-point-contract.cjs`
  - Performs nine static assertions and intentionally records the remaining scanner dependencies rather than claiming they are gone.

## Contract interpretation

The finite lattice is the powerset of canonical class identities reachable through the available declaration inventory. Each successful round adds one previously unseen ancestor. A root is a complete closure boundary. A cycle, ambiguous identity, unresolved class name, or missing inventory parent is a blocked semantic outcome; the known evidence may be saturated, but the source project's full ancestry is not asserted complete.

`rounds` is the number of declaration-transfer inspections, including the final root or blocking boundary. `knownAncestors` counts resolved ancestor declarations carried by the judgment. These are audit evidence, not a claim that arbitrary data-flow analyses converge without monotonicity or finite-height assumptions.

## Trace status

`LaravelControllerInvocationSemanticJudgmentInterface` remains a four-outcome discriminated union. `LaravelControllerScanArtifact` still correlates invocation outcome, integrated response judgment, and AST projection judgment. The scanner still calls the integrated response pipeline and AST projection authority.

The following remain unresolved:

- `laravelControllerScanner.ts` still imports `semantic/relations` operations and still calls `scanControllerAction`.
- `controllerActionContract.ts` still performs action-contract derivation and imports relation helpers and controller subscanner utilities.
- Declaration authority still has helper functions for identity comparison, action selection, and middleware interface recognition. This phase removes recursive ancestry walking but does not make the whole authority declarative-only.
- The scanner still contains its runtime executor class and ordinary functions/constant bindings. No claim is made that these have been removed.
- The project-wide typecheck, build, and Vitest suite were not run in this environment.

## Static audit

Command:

`node scripts/audits/audit-phase2085-controller-ancestry-fixed-point-contract.cjs`

Expected result: `RESULT 9/9`.
