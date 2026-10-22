# Phase 2161 — Return Semantic Argument Closure and Response Descriptor Ownership

## Trace

`CLI scan/sync → controllerInvocationManifestComposition → LaravelControllerScannerExecutor → actionJudgment.judge → actionExecution.execute → controllerActionContract → controllerReturnSemanticFromMethod → controllerDataflowContract → integrated response pipeline → invocation/response AST projection → manifest`.

`generate` remains a manifest consumer and is not allowed to reconstruct Laravel semantics.

## Repair applied

`controllerReturnSemanticFromMethod(method, file, responseReferenceJudgment)` previously called `semantic(method, 'Controller', file, response).returned`. The function parameter was named `responseReferenceJudgment`; `response` was not declared in that function. This could fail at runtime when the function was executed. The call now forwards the exact judgment parameter.

The action semantic coverage now includes a typed `response_descriptor_resolution` ownership obligation. The action judgment is not described as fully closed while `resolveResponseAttributeAst` still owns response DTO class resolution and response shape/field derivation. The contract version advances from 20 to 21 in both the upstream interface and production wiring.

## Boundaries preserved

- The existing `LaravelControllerResponseSemanticPipelineInterface` remains the owner of integrated response composition.
- The exact invocation judgment remains attached to the integrated response and AST projection.
- A descriptor response-reference candidate is not relabelled as observed PHP return evidence.
- No `relation/foundation` layer, duplicate response authority, or new response subscanner was added.
- The existing response attribute resolver was not merely moved into another file; its ownership gap is now explicit and remains open for a real upstream semantic contract.

## Remaining work

`resolveResponseAttributeAst` still performs DTO source-file resolution, shape/field derivation, and observed/declaration merge through the legacy controller response-attribute scanner. A future migration must first define the typed evidence and closed judgment for that semantic responsibility, then wire its existing consumers. Do not claim response descriptor derivation is upstream-owned yet.

## Validation scope

The targeted audit checks semantic argument forwarding, ownership coverage, contract version consistency, and preservation of integrated response/invocation correlation. Syntax-only TypeScript transpilation is run for changed TypeScript files. Full build, full typecheck, and Vitest are not run.
