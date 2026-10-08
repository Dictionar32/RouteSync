# Phase 679 — Build Error Repair / Highest AST Contract Stabilization

Phase 679 repairs the build errors surfaced after Phase 678.

## Repairs

- Removed duplicate public `addDependency` export from `packages/core/src/compiler/index.ts`.
- Corrected scanner binder relative imports for `semanticTypeConstructionRelations`.
- Corrected route factory relative imports for `types/domain/validationRules`.
- Corrected resource semantic mapping relative import for `types/upstream/astSemanticStageInterfaceAlgebra`.
- Stabilized the highest AST judgment projection contract in `packages/core/src/types/upstream/ast.ts`:
  - `SemanticAstNode` and `CanonicalAstNode` now directly denote the closed `AstJudgmentContract` for their kind.
  - projection accepts the shared `{ kind, semantic, source }` boundary shape.
  - algebra projection derives source from judgment provenance, preserving the closed AST judgment as authority.
  - no `as unknown as` bridge was introduced.

## Verification

- Phase 678 frontier audit: PASS.
- Upgraded surface: clean.
- Phase 525 inactive-file vacuum: PASS, candidates=[] / remainingNonEmptyCandidates=[] / allCandidatesEmpty=true.
- Targeted TypeScript import resolution check: no unresolved-module diagnostics for repaired imports.
- Isolated TypeScript AST contract check: no diagnostics from `packages/core/src/types/upstream/ast.ts`.
- Full `npm run build` could not be executed in the extracted environment because the dependency installation was incomplete and `tsup` was unavailable; the original reported build errors were repaired statically and the affected modules were checked for import resolution/type consistency.

## Remaining Frontier

Phase 678 audit continues to report scanner text-processing and resolver/parser boundary constructs as the next semantic-frontier work. These are intentionally not claimed closed by Phase 679.
