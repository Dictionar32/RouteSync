# Phase 2060 — PHP Class Reference Context Judgment, Interface First

## Trace finding

The static-call AST classifier previously kept only `tokens[0]` as the class name. That silently discarded namespace separators and subsequent name segments. The model catalog only carried short model class names, so attempting to infer a fully qualified reference from the short spelling would be unsound.

## Change

- The static-call parser preserves the complete lexical class spelling before `::`.
- `ControllerStaticCallOriginInput` now carries `ControllerStaticCallClassReferenceEvidence`: `simple_name` or `qualified_name` with a typed lexical form (`fully_qualified`, `namespace_relative`, or `import_or_namespace_dependent`).
- The existing model-class identity rule explicitly blocks qualified references when the canonical qualified model identity is not available. The result is `static_call_qualified_model_identity_unavailable`, not a guessed short-name match.
- `ControllerStaticCallOriginAuthorityInterface` advances to contract version 5.
- The existing origin authority, argument rules, model catalog, and resource binding composition remain the owners; no duplicate authority is added.

## Intentionally not claimed

This phase preserves qualified spelling and blocks contextless guessing; it does not yet resolve PHP imports/aliases or normalize model declaration FQCNs. That requires canonical qualified model identities and, for relative/import-dependent names, the class source's namespace/import environment to be carried into the existing contract. Until that evidence is available, a qualified reference remains unresolved.

## Verification boundary

The phase audit is structural. Full typecheck, build, and Vitest must be run in the user's supported project environment.

No `relation/foundation` subscanner was introduced. There is no duplicate invocation, integrated-response, AST, or static-call authority.
