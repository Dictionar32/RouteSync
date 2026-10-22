# RouteSync Phase2472 — Model Source Semantics Upstream

## Baseline and scope

Baseline: Phase2471 `Model-Relation-Dependency-Closure`. No source files were moved. This phase closes the last direct `semantic/relations` import in the Laravel model scanner and makes the model-source semantics path explicit through a typed evidence contract and upstream judgment.

## Trace and root cause

`modelParser.ts` was still responsible for assembling inheritance, model traits, method return annotations, method source statements, and constants while importing `relationGate`, `relationEqual`, `relationProject`, and `relationFold`. The module therefore combined AST-to-evidence adaptation with semantic defaulting and depended directly on the relation helper layer.

The existing upstream `ModelInheritance`, `ModelMethod`, `ModelConstant`, `ModelSourceCapabilities`, `Sequence`, and `SourceStatements` contracts already described the output shapes, but there was no explicit upstream operation contract for judging the model source-semantics evidence. The missing contract was added instead of duplicating the existing output types or creating a new schema lookup authority.

## Changes

- Added `types/upstream/modelSourceSemanticsAuthorityInterface.ts` containing `ModelSourceSemanticsEvidence`, `ModelMethodReturnTypeEvidence`, and the closed `ModelSourceSemanticsJudgment`.
- Added `types/upstream/modelSourceSemanticsAuthority.ts`; it owns the return-annotation judgment, including the explicit fallback of unsupported return annotation syntax to `mixed`, and projects the evidence into existing upstream model types.
- Exported the interface and authority through the existing upstream barrel.
- Updated `modelParser.ts` to expose AST-specific adapters through explicitly typed `export const` operations and invoke `modelSourceSemanticsAuthority.judge(...)` on the production model path.
- Replaced direct relation collection helpers in `modelParser.ts` with native deterministic collection projection/reduction; primary-key origin now follows the source-property judgment as it is applied.
- Updated Phase2470 and Phase2471 audit expectations to reflect the completed removal of direct relation imports from the model scanner.
- Added Phase2472 audit and smoke commands to the core package.
- No source files were relocated. No duplicate model schema lookup authority was added; Phase2470's existing `SchemaRelationIndexInterface` reuse remains intact.

## Verification

- Phase2472 audit: 10/10 passed.
- Phase2472 smoke: 4/4 passed.
- Phase2471 audit: 13/13 passed after updating its expected dependency frontier.
- Phase2471 smoke: 4/4 passed.
- Phase2470 audit: 10/10 passed after updating its expected dependency frontier.
- Phase2470 smoke: 3/3 passed.
- TypeScript syntax transpilation and package JSON parsing are performed separately for the changed files before packaging.

Full package typecheck, full Vitest, package build, and end-to-end CLI have not been run. This report does not claim whole-repository type/build/CLI success.

## Dependency frontier after Phase2472

- Direct `semantic/relations` imports under `packages/core/src/compiler/scanner/subscanners/model`: 0.
- Direct `semantic/foundation` imports under the model scanner: 0.
- Direct `semantic/relations` imports under the entire `subscanners` tree: 36 files remain.
- Direct `semantic/foundation` imports under the entire `subscanners` tree: 0 files found.
- `export function` declarations under the entire `subscanners` tree: 47 remain; under the model scanner: 0 remain.

This phase closes the model directory's direct relation dependency, not the entire `subscanners` tree. Remaining relation imports and exported function declarations outside the model scanner require the same audit → trace → existing-contract reuse/evolution → actual consumer wiring → regression verification sequence.
