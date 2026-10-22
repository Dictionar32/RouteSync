# Phase 2267 — Canonical Dataflow Judgment Projection

## Trace

The production CLI path remains:

`packages/cli/src/index.ts` → CLI `scan` / `sync` command → `buildManifestWithInvocationPipeline` → `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` → invocation semantic pipeline → `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` → Laravel source AST pipeline → `LaravelControllerScannerInterface` → `packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts` → existing action semantic judgment authority → action contract resolver → action judgment publication and manifest/AST projection.

Within `createActionJudgmentAuthority`, the parsed method's existing `body.dataflow` is the canonical `ControllerDataflowSemanticJudgment`. Phase 2267 passes that judgment into `ControllerActionContractResolverContext` as `dataflowJudgment`. `resolveControllerActionContract` now obtains `semanticVariables` and publishes `dataflowJudgment` from that exact context field rather than trying to read a nonexistent `bodyJudgment.dataflow` field or independently republishing the method AST field.

## Upstream interface recommendation

Evolve the existing `ControllerActionContractResolverContext` and `LaravelControllerActionContractResolverInterface` path; do not add a second dataflow authority. The existing `ControllerDataflowSemanticJudgmentAuthorityInterface` owns dataflow closure, and its produced judgment is the semantic input. The resolver is only a compatibility contract projection. Wiring supplies the judgment; runtime/scanner projection forwards it.

## Actual changes

- Added `dataflowJudgment` to `ControllerActionContractResolverContext`, using the existing upstream judgment type.
- `resolveControllerActionContract` reads `context.dataflowJudgment.semanticVariables` and assigns the same judgment to `ControllerActionContract.dataflowJudgment`.
- Production wiring and the focused resolver test fixture pass the canonical parsed dataflow judgment into the context.
- Added `scripts/audits/audit-phase2267-dataflow-judgment-projection.cjs` to guard the projection boundary.

## Verification and limits

The phase-specific static audit and the Phase 2266 static audit are run independently. No package build, TypeScript project check, or Vitest suite is claimed as passing.

This does not close all scanner migration debt. `controllerAstCanonical` still owns body/return source adapters; dependency evidence still calls expression/resource subscanner helpers; and `semantic/relations` remains a transitive dataflow dependency. The CLI route is therefore not claimed to be fully subscanner-free or relation-free. No `semantic/foundation` dependency is introduced.
