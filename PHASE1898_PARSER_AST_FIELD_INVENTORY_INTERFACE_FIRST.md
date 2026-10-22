# Phase 1898 — Parser AST Field Inventory, Interface First

## Goal

Trace the exact `ControllerDeclarationAst` fields consumed by the four production callers of the legacy controller parser, and record the requirements in the existing upstream scanner contract before changing parser runtime.

## Findings

`parseControllerDeclaration(...)` calls `parseControllerMethod(...)` with `filePath` and `integratedResponse`; the method parser forwards both to `parseControllerBody(...)`, where `analyzeControllerDataflowWithIntegratedResponse(...)` participates in body-dataflow projection. Therefore the legacy entry is not a syntax-only parser, despite the structural nature of its consumers.

The four production consumers use these AST fields:

- `attributeAstCanonical.ts`: class name; constructor method name, parameters, declared return type, body statements and source; declaration source line.
- `providerAstCanonical.ts`: class attributes and their arguments/source; class name; method name, body statements and source; declaration source line.
- `middlewareAstCanonical.ts`: class name; handle method name, parameters, body statements, returns and source; declaration source line.
- `responseScanner.ts`: declaration methods, each method's returns and source line.

The exact consumer inventory is now represented as the discriminated union `LaravelControllerLegacyParserAstFieldInventory` and exported value `LARAVEL_CONTROLLER_LEGACY_PARSER_AST_FIELD_INVENTORY` in `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`. The existing `LaravelControllerInvocationSemanticBoundaryContract` advances to v65 and owns this inventory. No second invocation judgment model was added.

## Decision

Do not remove the legacy parser yet. Although these consumers do not require integrated invocation-response semantics for their stated projections, the current AST-building implementation still computes body dataflow through that semantic input. The next implementation step is to define a genuinely syntax-only body/method projection contract and migrate these consumers to it, preserving only the fields above. Keep the canonical production controller path bound to one `LaravelControllerInvocationSemanticJudgmentInterface`.

## Verification

- Phase 1898 audit: 14/14 checks passed.
- Audit scripts phase 1874–1898: 25 scripts passed, 0 failed.
- Across the 17 scripts that emit explicit `RESULT` lines: 202/202 checks passed. Eight older scripts passed by exit status and do not emit a `RESULT` line.
- `package.json` JSON parse passed; new audit passed `node --check`.
- TypeScript compilation/build was not run.
- Runtime parser, method parser, body parser and scanner remain unchanged in this phase.
- No `semantic/foundation` dependency was introduced.
