# Phase 3003 Changelog

- Added `ControllerDataflowSemanticJudgmentAuthorityDependencies` and `ControllerDataflowSemanticJudgmentAuthorityFactoryInterface` to the upstream contract module.
- Replaced the exported `createControllerDataflowSemanticJudgmentAuthority(...)` parameterized factory with `controllerDataflowSemanticJudgmentAuthorityFactory: ControllerDataflowSemanticJudgmentAuthorityFactoryInterface`.
- Wired the production controller dataflow singleton through the new canonical factory and exported it from the upstream barrel.
- Added `InvocationSemanticValidatedPublication`, `InvocationSemanticRejectedPublication`, typed result handlers, and `continueWith(...)` to both publication result variants.
- Updated the publication authority to attach continuations to validated and rejected results while retaining the original analysis, publication, and violation references.
- Updated the focused scanner dataflow test to consume the publication ADT through `continueWith(...)` and use the declared integrated-response shape.
- Added a repeatable Phase 3003 structural audit (17/17 checks passed).
- Synchronized `InvocationSemanticPipelineContract.version` with the existing runtime contract value at version 62, correcting the interface/runtime version mismatch found during targeted checking.
- Preserved the intentionally empty upstream `collections.ts` and did not restore the removed relation foundation modules.
