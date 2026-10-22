# Phase 2086 — Interface-first root-cause trace

## Scope and honesty

This phase continues from Phase 2085 without creating another interface file or a parallel semantic model. It inspects the existing declaration judgment, invocation judgment, response pipeline, AST projection, and scanner wiring. This is a source trace plus a narrow correction to the existing ancestry-closure contract; it is not a claim that the Laravel scanner has been fully migrated.

## Trace: existing canonical chain

1. `types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts` defines the existing invocation input ADT and a four-outcome judgment whose `response` field is narrowed to one exact `PhpSourceInvocationSemanticPipelineIntegrationResult` member.
2. `types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts` executes that contract using the existing source-binding and integration authorities. It still uses a class and switches to construct outcome-indexed judgment values; this is authority execution, not a reason to add a second invocation interface.
3. `types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` carries the canonical judgments into a source-inventory closure receipt. The scanner consumes this receipt rather than creating invocation judgments.
4. `types/upstream/laravelControllerScannerInterface.ts` defines the existing scanner contract and `LaravelControllerScanArtifact` ADT. Each artifact variant correlates an exact invocation response outcome with the allowed response and AST-projection judgments.
5. `types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts` owns the integrated-response and AST-projection contracts; `types/upstream/laravelControllerResponseSemanticPipeline.ts` supplies the existing pipeline implementation.
6. `compiler/scanner/wiring/laravelControllerScanner.ts` forwards the canonical invocation judgment into response integration and AST projection. However, it still imports `semantic/relations`, uses relation folds/projections, and calls `scanControllerAction`; action derivation and runtime orchestration have not been eliminated.
7. `types/upstream/controllerDeclarationSemanticJudgmentInterface.ts` owns declaration/action-selection outcomes and the ancestry-closure certificate. Its authority walks a single-parent chain and grows a `seen` identity set; blocked boundaries produce a partial closure over resolved inventory evidence.

## Root cause found

The architecture already has canonical invocation, response, AST-projection, and declaration contracts. Adding another parallel interface for these same meanings would duplicate ownership. The real gaps are in (a) the rigor of the ancestry closure certificate, and (b) the remaining runtime wiring that still calls relation helpers and action subscanners.

The Phase 2085 certificate named a finite identity-set lattice and least fixed point, but did not make the lattice order, bottom, join, transfer behavior, monotonicity invariant, or finite-height bound explicit. This phase strengthens the *existing* certificate instead of introducing a new interface. The bound is conservative: `inventory.length`, so duplicate/ambiguous candidates can only make it larger than the actual canonical-identity lattice height.

## Existing-contract correction

`ControllerDeclarationAncestryClosure` now states the finite lattice model explicitly:

- order: subset by canonical class identity;
- bottom: empty identity set;
- join: set union;
- transfer: add one resolved parent identity or reach a boundary;
- monotonicity: the seen-identity set only grows;
- height bound: declaration inventory length;
- fixed-point outcome: complete only on root reach, partial when ancestry resolution stops at a blocked boundary.

The runtime traversal still computes the result imperatively. The metadata describes the model/invariants; it is not a machine-checked mathematical proof. Cycle detection remains a blocked outcome and does not claim source ancestry is complete.

## Still unresolved (explicitly not claimed as fixed)

- `laravelControllerScanner.ts` still imports `semantic/relations` and relation helpers.
- `scanControllerAction` and controller AST helpers still derive action contracts during scanner execution.
- `LaravelControllerScannerExecutor` remains a class with helper methods.
- The invocation authority still performs outcome-preserving switches to build the correlated judgment ADT.
- The scanner still reads a path payload for file I/O and derives a basename; this is runtime source access, not an invocation judgment reclassification, but it remains a place where identity-bound parsing should be reviewed.
- `semantic/foundation` is not imported directly by this scanner file, but this trace does not prove there are no transitive foundation dependencies elsewhere.

## Validation boundary

Only source-level structural checks and ZIP integrity are claimed for this phase. Do not interpret these checks as a TypeScript build, full typecheck, or Vitest run.
