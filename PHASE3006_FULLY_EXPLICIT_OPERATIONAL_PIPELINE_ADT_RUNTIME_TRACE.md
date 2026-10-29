# Phase 3006 — Fully Explicit Operational Pipeline ADT Runtime Trace

## Scope

This phase continues from Phase 3005 and elevates the PHP whole-file invocation pipeline result and its composition evidence into operational upstream ADTs. It addresses one reachable runtime slice; it does not claim a repository-wide export migration or complete CLI manifest provenance closure.

## Runtime trace

```text
CLI scan / sync
  → RouteSyncCliManifestScanOperationInterface.scan(input)
  → ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  → source discovery and PHP whole-file source pipeline
  → PhpSourceInvocationSemanticPipelineResult
       ├─ complete: continueWith({ onComplete, onBlocked })
       └─ blocked:  continueWith({ onComplete, onBlocked })
  → source-file identity relation judgment
  → source-binding ADT
       ├─ same identity: continueWith({ onSame, onDifferent })
       └─ different identity: continueWith({ onSame, onDifferent })
  → pipeline composition evidence ADT
       ├─ not connected: continueWith(...)
       ├─ connected: continueWith(...)
       └─ source binding rejected: continueWith(...)
  → integration authority
       → exact complete / blocked / rejected / not-connected result
  → controller invocation semantic judgment
  → manifest builder and CLI manifest terminal ADT
```

## What changed

`PhpSourceInvocationSemanticPipelineResult` now provides `continueWith` operations on both complete and blocked variants. The operation dispatches directly to `onComplete` or `onBlocked`, retaining the exact pipeline payload. `PhpSourceInvocationSemanticPipelineCompositionEvidence` also owns `continueWith` for its three outcomes. The integration authority now composes these operations rather than switching on their `kind` tags.

The source-binding authority similarly consumes `SourceFileIdentityRelationJudgment.continueWith`; the identity relation remains the authority that decides whether the exact source endpoints match. No CLI string heuristic is introduced and no source identity is copied into a parallel alias.

## Example use

```ts
pipelineResult.continueWith({
  onComplete: complete => publishValidatedBatch(complete.batch),
  onBlocked: blocked => preserveStageEvidence(blocked),
});
```

The caller supplies domain continuations; it does not inspect a tag, rebuild the outcome, or convert a blocked result into success.

## Laravel/PHP modeling relevance

Laravel routing distinguishes callback routes and controller actions, and its dependency-injection and route-model-binding rules carry semantic facts from PHP source. The upstream source pipeline must preserve the exact source document, extraction coverage, inventory, resolution judgments, and invocation batch so the CLI manifest layer does not infer these facts from primitive strings.

Official references:
- Laravel Routing: https://laravel.com/framework/docs/routing
- Laravel Controllers: https://laravel.com/framework/docs/12.x/controllers
- PHP Type Declarations: https://www.php.net/manual/en/language.types.declarations.php

## Audit status

- Structural audit: see `PHASE3006_AUDIT.json` and `PHASE3006_AUDIT.log`.
- Syntax transpilation: see `PHASE3006_SYNTAX_CHECK.json`.
- Full typecheck: not passed; workspace-wide diagnostics include pre-existing missing relation imports, the intentionally empty collections module, missing Vitest types/dependencies, and unrelated type errors. No diagnostics were reported for the six changed runtime TypeScript modules in the narrowed compiler output; the scanner test still has unrelated baseline diagnostics.
- Vitest and CLI/Laravel E2E: not run.
- Field-by-field route-manifest to CLI-invocation-manifest provenance remains open.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- Removed relation foundation modules remain absent.
