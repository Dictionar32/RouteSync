# Phase 2258 — Action Authority Dependency Injection Closure

## Change

The existing `LaravelControllerExecutionDependencies` boundary now exposes the existing upstream interfaces for request semantic binding, resource binding, and parameter class-name judgment as explicit dependencies. The action judgment factory receives these dependencies and uses them for request judgment, resource candidate judgment/publication, and dependency parameter class-name resolution.

## Before

The action authority's `judge` implementation captured three concrete singleton authorities directly. That made the declared composition boundary incomplete: replacing the dependencies bundle could not replace all semantic authorities used by action judgment.

## After

`createActionJudgmentAuthority` receives:

- `LaravelControllerRequestSemanticBindingAuthorityInterface`
- `ControllerResourceBindingAuthorityInterface`
- `ControllerParameterClassNameJudgmentInterface`

The production composition root binds the already-existing implementations. No duplicate authority or new semantic classifier was introduced.

## Trace

`LaravelControllerActionSemanticJudgmentAuthorityInterface.judge`
→ request evidence projection
→ injected request semantic authority
→ existing action contract resolver, with the injected resource and class-name authorities
→ injected resource authority publishes resolved resource facts
→ canonical action semantic judgment publication.

## Remaining ownership debt

This change closes concrete singleton capture at the composition boundary. It does **not** retire `resolveControllerActionContract`, `controllerAstCanonical`, or the remaining `subscanners` dependencies. The resolver still performs semantic derivation; that remains a separate ownership migration and must not be reported as complete. No dependency on `semantic/foundation` or `semantic/relations` was added.

## Validation

`scripts/audits/audit-phase2258-action-authority-dependency-injection.cjs` performs 9 static assertions. All 9 pass in the snapshot. This is a source-level wiring audit, not a TypeScript build or runtime test result.
