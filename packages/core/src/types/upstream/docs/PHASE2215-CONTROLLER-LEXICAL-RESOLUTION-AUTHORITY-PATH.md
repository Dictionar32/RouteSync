# Phase 2215 — Controller Lexical Resolution Authority Path

## Trace finding

`LaravelControllerScannerExecutor.scanControllers` called `parseControllerDeclarationFromInvocationJudgment` with
`this.responseSemanticPipeline.dependencies.classNameResolutionAuthority`. That property is not part of
`LaravelControllerResponseSemanticPipelineDependenciesInterface`; the existing class-name authority is owned and exposed
through `LaravelDtoTypeReferenceBindingAuthorityInterface.dependencies.classNameResolutionAuthority`.

This is a dependency-path mismatch, not a reason to create another authority or widen the dependency contract with a duplicate.

## Change

The scanner now consumes the existing authority through:

`responseSemanticPipeline.dtoTypeReferenceBindingAuthority.dependencies.classNameResolutionAuthority`

This preserves the single existing `PhpClassNameResolutionRuleInterface` owner and avoids reaching for a dependency that the pipeline contract does not declare.

## Boundary preserved

- Invocation judgment remains the input to the integrated response pipeline.
- `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` remains the owner of integrated HTTP response judgment.
- The runtime executor remains a delegate; this change adds no semantic classification.
- No `semantic/foundation`, replacement relation layer, or subscanner was introduced.

## Remaining gaps

- `scanControllerAction` and `resolveControllerActionContract` still perform legacy action/response derivation.
- Integrated response products are retained at controller artifact level; action-level legacy descriptor replacement still requires proven exact method/source correlation and compatibility projection parity.
- `semantic/relations` usage still requires a call-site trace.
- Channel classification still needs authoritative client subscription evidence.
- Full typecheck, full Vitest, and package build were not run.
