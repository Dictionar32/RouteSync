# Phase 3099 — Fixed Terminal Manifest Contract

## Scope

This phase narrows the CLI terminal contract in the actual runtime path from `scan` / `sync` / drift audit to manifest projection. It does not claim a repository-wide export migration.

## Source change

`packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts` no longer uses a generic `Result` parameter for `ControllerInvocationManifestDriftAuditHandlersInterface` or `ControllerInvocationManifestTerminalOperationInterface.continueForDriftAudit`.

The successful branch now returns `Extract<ManifestBuilderJudgment, { readonly kind: 'manifest_builder_complete' }>['manifest']` explicitly, so the return type stays tied to the upstream complete judgment without introducing another export dependency. Every failure branch still returns `never`, so blocked/rejected outcomes cannot be represented as a successful manifest or an optional sentinel.

## Runtime trace

```text
CLI scan / sync / drift audit
  -> RouteSyncCliManifestScanOperation
  -> ControllerInvocationManifestCompositionAuthority
  -> source discovery and source reads
  -> identity-binding batch
  -> source-read batch
  -> semantic inventory closure
  -> ManifestBuilderJudgment
  -> ControllerInvocationManifest terminal adapter
  -> continueForDriftAudit(named handlers)
  -> RouteSyncManifest projection
  -> generator / drift comparison
```

## Invariants preserved

- The CLI owns terminal presentation; core does not import CLI terminal contracts.
- Named blocked/rejected handlers remain distinct.
- Failure handlers remain `never`-returning.
- Source-read evidence, identity rejections, partial documents, and blockers remain represented by their existing terminal judgments.
- Deleted relation-foundation modules are not restored.

## Limits

This is a bounded migration. It removes generic result polymorphism at this terminal boundary but does not remove the named handler object itself. It does not eliminate `if`, `switch`, `??`, `map`, `reduce`, or primitive types repository-wide. The full typecheck, test suite, and PHP-to-manifest/generator E2E have not been verified in this environment.
