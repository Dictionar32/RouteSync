# Phase 2193 — Interface-First Invocation/Response AST Projection

## Trace finding

The canonical Laravel controller scanner already receives the closed invocation judgment and response pipeline through upstream contracts. However, the controller-body parser imported `laravelControllerAstProjectionSemanticAuthority` directly and invoked it while parsing each method body. This left an implementation binding inside the parser, despite the upstream `LaravelControllerAstProjectionSemanticAuthorityInterface` already existing.

## Change

The existing authority interface is now injected through the existing call chain:

`LaravelControllerScannerInterface.astProjectionAuthority` → `LaravelControllerScannerExecutor` → `LaravelSourceLexer.parseControllerDeclarationFromInvocationJudgment` → `parseControllerDeclaration` → `parseControllerMethod` → `parseControllerBody` → `authority.judge(context)`.

The authority receives the exact `LaravelControllerAstProjectionContext`, including the original invocation judgment and, when present, its integrated response judgment. The parser does not recreate either judgment. Existing direct parser callers remain source-compatible through the current composition default, while the production scanner path now explicitly injects the authority through the interface.

The scanner contract version is now 35 because its public dependency contract includes `astProjectionAuthority`.

## Scope guard

- No `relation`, `foundation`, or subscanner layer was added.
- No new semantic authority or duplicate judgment model was introduced.
- The existing `LaravelControllerAstProjectionSemanticAuthorityInterface` was reused.
- Runtime parsing delegates the projection decision; it does not classify invocation/response meaning.

## Validation

Six changed TypeScript files passed `transpileModule` syntax validation. Full project typecheck, Vitest, and build were not run. The syntax check is not a substitute for typechecking.

## Remaining audit items

1. Other parser paths should be checked for direct concrete authority imports.
2. The response pipeline still contains composition-time bindings to several concrete upstream authorities; those dependencies should be evaluated and, where useful, grouped into an existing pipeline dependency contract rather than adding a parallel layer.
3. DTO response projections are still integrated evidence and have not yet replaced the canonical per-method response product in every path.
