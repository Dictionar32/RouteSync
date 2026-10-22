# Phase 2269 — Dependency Evidence Uses Existing Authorities

## Why this phase exists

Phase 2268 introduced `ControllerDependencySourceEvidenceProjectionInterface<TSourceEvidence>`. That generic boundary only abstracted the input type; it did not close semantic judgments, remove parser-specific expression conversion, or establish ownership. It was an unnecessary abstraction and is removed in this phase.

## Trace and correction

Production flow remains:

`CLI → upstream manifest builder → Laravel controller scanner → action judgment composition → dependency evidence projection → existing dependency judgment authority → action contract resolver → manifest projection`.

Changes:

- Removed the new generic `ControllerDependencySourceEvidenceProjectionInterface<TSourceEvidence>` from the upstream dependency contract.
- Made the scanner-side projection input explicit and non-generic because it is tied to `ControllerParameterAst`.
- The projection receives a closed `ControllerParameterClassNameJudgment`; it no longer calls `classNameJudgment.judge(...)` while constructing source evidence.
- The projection delegates PHP expression derivation through the already-existing `PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>` instead of importing `expressionProducer` directly.
- The action authority composition closes class-name judgments before invoking source projection and still uses the existing `ControllerDependencySemanticJudgmentAuthorityInterface` for dependency decisions.
- Expression argument sequence construction uses the existing `Sequence` ADT without importing the resource subscanner sequence helper.

## Explicitly not claimed

The current concrete `controllerPhpAstExpressionSemanticAuthority` is still bound in `controllerVariableSemanticRuntimeBinding.ts` to `resourcePhpAstExpressionSemanticAuthority`, whose implementation lives under `subscanners/resource`. Therefore this phase removes direct subscanner dependencies from the dependency evidence projection, but does **not** claim the complete transitive CLI path is subscanner-free. That concrete expression authority's ownership is a separate upstream migration and must not be solved by moving the same implementation to another file.

No `semantic/foundation` dependency was introduced. No second dependency judgment authority was introduced. No build, TypeScript type-check, or Vitest is claimed.

## Official design references

- MLIR Interfaces explains that compiler transformations should consume stable semantic interfaces instead of encoding implementation-specific knowledge: https://mlir.llvm.org/docs/Interfaces/
- TypeScript discriminated unions describe how to represent closed semantic variants with explicit tags: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
