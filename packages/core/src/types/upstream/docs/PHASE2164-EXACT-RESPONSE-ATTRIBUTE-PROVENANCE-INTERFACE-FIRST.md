# Phase 2164 — Exact Response Attribute Provenance, Existing Interface First

## Trace finding

The integrated response pipeline and its semantic judgment/runtime executor already exist and remain wired through `LaravelControllerScannerExecutor`. The source-evidence producer previously attached the whole controller method span to `response_attribute_source`, so consumers could not distinguish the precise declaration token range from method-level context.

## Change

- `DeclaredResponseAttributeAst` now retains the parser token span from `#[` through the verified closing `]`.
- The existing `ControllerMethodEvidenceSyntax` producer contract transports the exact source offsets without exposing scanner AST types to upstream.
- `ControllerResponseAttributeSourceEvidence` retains a typed `SourceSpan` for declared attributes.
- The existing response evidence producer binds `response_attribute_source` to the exact attribute span when declared. Absence remains an explicit ADT variant and retains method-observation provenance instead of fabricating an attribute span.
- Existing producer and integrated pipeline contract versions advance to reflect the changed provenance guarantee.

## Explicitly not claimed

This does not retire `resolveResponse()` or `responseAttributeScanner.ts`. The current response semantic authority still builds per-method return semantics from the action's existing semantic return, so this phase improves evidence provenance but does not complete the larger migration of response descriptor/DTO derivation into the integrated response authority. DTO declaration evidence remains an open producer obligation. No new authority, `relation/foundation`, or subscanner is introduced.

## Verification boundary

Run the focused Phase 2164 audit and syntax-only TypeScript transpilation for changed files. Do not run full build, full typecheck, or Vitest as part of this phase.
