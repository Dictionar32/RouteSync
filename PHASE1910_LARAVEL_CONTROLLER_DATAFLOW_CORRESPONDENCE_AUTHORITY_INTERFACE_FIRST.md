# Phase 1910 — Laravel Controller Dataflow Correspondence Authority (Interface First)

## Trace finding

Phase 1909 exposed a closed matched/missing/ambiguous result, but the analyzer still computed that result locally. The previous implementation also treated the binding source span as a `SourceSpan`, although canonical semantic knowledge carries `SemanticSource` (`filePath` plus a `source-span`). That weakened the intended source identity boundary and risked a type mismatch.

## Changes

- Extended `controllerDataflowBindingPayloadCorrespondenceInterface.ts` with an explicit upstream authority interface and a typed input contract.
- Added `controllerDataflowBindingPayloadCorrespondenceAuthority.ts`, which matches canonical semantic source file identity and start/end offsets against adapter payload provenance and returns one closed judgment.
- Wired the authority at `controllerVariableSemanticRuntimeBinding.ts`.
- Removed local `correlateBindingPayload` and `sameSourceSpan` judgment logic from `controllerDataflowAnalyzer.ts`; the analyzer forwards the authority's judgment and only projects definitions from the `matched` variant.
- Advanced `LaravelControllerInvocationSemanticBoundaryContract` to v76 and recorded the authority boundary.
- Kept `invocationJudgment` and `invocationSemanticIntegratedResponse` distinct and retained on the same dataflow model.

## Remaining work

This is not yet a wiring-only scanner. The analyzer still traverses PHP AST to collect payloads, derives variable origin locally, projects PHP expressions, resolves semantic variable evidence, and groups definitions. Those steps need consumer-traced ownership in existing upstream contracts before they can be retired from the analyzer. Build, typecheck, and package tests were not run by design.
