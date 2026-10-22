# Phase 2182 — Integrated DTO Resolution Judgment

## Trace result

The controller scanner already forwards a typed PHP lexical context with a declared response attribute. The existing integrated response pipeline retained the complete project DTO inventory, but `judgeIntegratedResponse` did not invoke the shared PHP class-name resolver or the DTO declaration resolution authority. The inventory was therefore carried as context without its requested declaration ever being judged by the integrated response path.

## Changes

- `PhpClassNameResolutionInput.context` now admits an explicit `php_class_name_resolution_context_unavailable` ADT case. The existing `phpClassNameResolutionAuthority` returns the existing blocked judgment with `class_name_resolution_context_unavailable`; missing context is not forged into an empty namespace/import table; fully qualified PHP class names remain resolvable without lexical imports.
- The existing `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` composition now resolves each declared response attribute through `phpClassNameResolutionAuthority`, then passes that exact result and the existing project-scoped inventory to `laravelControllerResponseDtoDeclarationResolutionAuthority`.
- The response semantic input retains the resulting judgments separately from controller-local source-binding evidence. DTO source files are not incorrectly compared to the controller invocation file.
- `judgeResponse` preserves these judgments as explicit semantic evidence. An unresolved or ambiguous declared DTO blocks response completion; a resolved declaration is retained but is not promoted to a `ResponseContract` without a real DTO-to-response-contract projection.
- The existing response semantic authority remains the response-meaning owner, the existing invocation judgment is forwarded unchanged, and the runtime executor continues to delegate to the response authority.

## Deliberately still open

1. Resolve the response attribute into a canonical response descriptor.
2. Project the resolved DTO AST into a closed `ResponseContract` using a typed DTO-field contract.
3. Retire legacy descriptor derivation only after that projection is consumed end-to-end.

No `relation`, `foundation`, or new subscanner layer was added. No build or typecheck was run in this environment.
