# Phase 2061 — PHP Class Reference Context Judgment, Interface First

## Trace finding

Phase 2060 preserved qualified spelling but intentionally blocked every qualified class reference because the static-call authority did not receive the lexical namespace/import context and the model catalog held only short class names. That was safe but incomplete. The existing `PhpClassNameResolution` and `PhpClassImportBinding` contracts establish the right semantic vocabulary; this phase reuses those types rather than creating a second general PHP name-resolution subsystem.

## Changes

- `ControllerStaticCallModelClassIdentity` now carries `PhpQualifiedClassName` from the model declaration's actual namespace.
- `ModelScanner` extracts the namespace region from each model file and publishes a canonical class identity alongside the existing model AST/definition results.
- `ControllerDeclarationParser` captures the controller namespace and class-import inventory once and attaches it to method AST evidence.
- The context is carried through action wiring and `controllerDataflowContract` as evidence; scanner code does not resolve class references.
- The existing `ControllerStaticCallModelClassIdentityRuleInterface` now resolves fully qualified names, `namespace\\` relative names, import aliases, and current-namespace names, then matches only exact canonical qualified model identities.
- Incomplete import inventories remain blocked unless an explicit import already resolves the referenced leading segment. They are never treated as empty inventories.
- The existing `ControllerStaticCallOriginAuthorityInterface` advances to contract version 6. No second authority was added.

## Important limits

The model scanner currently discovers models from `app/Models`, matching its existing scan scope. This phase derives each declared PHP namespace from the source tokens; it does not infer namespace from the directory or assume `App\\Models`. Grouped class imports are still marked incomplete by the existing controller import inventory parser, so references depending on those imports fail closed rather than being guessed. Dynamic class references are outside this static-call evidence contract.

## Authority boundaries preserved

- Invocation remains owned by the existing invocation semantic judgment authority.
- Integrated response remains owned by the existing controller response semantic pipeline.
- Response-attribute inference remains owned by its Phase 2052 authority.
- AST rule arbitration remains owned by `AstClassificationRuleAlgebraInterface`.
- Static-call origin remains owned by the existing static-call origin authority.
- Resource binding composes the resulting origin judgment; it does not repeat class-name resolution.

No `relation/foundation` subscanner, duplicate AST facade, or parallel invocation/response/static-call authority was introduced.

## Verification boundary

The Phase 2061 structural audit and selected historical audits are run separately. Full TypeScript typecheck, build, and Vitest are not claimed unless explicitly executed in an environment with the project toolchain installed.
