# Phase 2135 — Inline Validation Source Provenance

## Trace finding

`ControllerBodyAst.validations` already retains a `TokenDescriptor` for each inline validation expression. However, `resolveControllerBody()` previously called `ScannedRouteValidationRuleEntry.create(field, rules)` without forwarding that evidence. The entry factory therefore used its default `<validation>` file and zero-length span, losing the real PHP source identity and offsets before schema judgment.

## Change

- `resolveControllerBody()` now requires the exact `SourceFile` from the action contract.
- Each inline validation entry now retains its own parsed PHP array-entry `SourceRange`; its offsets are converted into a `SourceSpan` with that exact source file.
- The span is supplied to `ScannedRouteValidationRuleEntry.create`, so canonical validation facts and nested shape provenance retain the actual source location.
- The existing `ControllerActionSchemaSemanticJudgmentAuthority` remains the owner of FormRequest/inline-schema merge semantics. No duplicate validation authority, foundation layer, or subscanner was introduced.
- Invocation judgment correlation, controller-wide integrated response, and runtime executor pass-through remain unchanged.

## Remaining debt

`actionValidationExtractor.ts` remains a separate legacy token-based extraction implementation and appears to have no production caller. It was not deleted or promoted into another authority. Inline rule-string interpretation and full AST-to-semantic derivation remain scanner concerns to trace separately; this phase fixes a concrete provenance loss on the active `ControllerBodyAst` path.

## Verification boundary

The Phase 2135 static audit verifies source-file propagation, exact per-entry source-range preservation, canonical schema ownership, and the unchanged invocation/response/runtime boundaries. A static audit does not replace full TypeScript typecheck, build, or Vitest.
