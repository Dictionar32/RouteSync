# Phase 2241 — Action Subscanner Bypass, Interface-First

## Change

The production `LaravelControllerActionSemanticJudgmentAuthorityInterface` composition no longer imports or calls `scanControllerAction` from `compiler/scanner/subscanners/controller`. It calls the existing `resolveControllerActionContract` directly with the already-produced request and body judgments. The action semantic contract is advanced to version 35 to describe this production-path change.

## Ownership preserved

- `LaravelControllerRequestSemanticBindingAuthorityInterface` remains the request semantic authority.
- `ControllerBodySemanticJudgmentAuthorityInterface` remains the body semantic authority.
- `LaravelControllerResponseSemanticPipelineInterface` remains the integrated-response authority.
- `LaravelControllerActionExecutionInterface` remains a judgment-forwarding boundary.
- Existing `ControllerResourceBindingAuthorityInterface` remains the resource judgment/publication authority.

## Explicitly not claimed

This change retires one subscanner hop, not all legacy semantic derivation. `resolveControllerActionContract` still performs derivation and imports helpers from subscanner modules. It remains the next ownership boundary to refactor. Merely relocating that function would not count as semantic ownership transfer; the next change must make each derivation output originate from an existing or genuinely necessary upstream judgment contract and reduce the resolver to projection/composition.

## Validation

The Phase 2241 audit checks source structure and the preserved authority boundaries. It is not a TypeScript typecheck or full build.
