# Phase 3100 — Terminal Manifest Operation Without Handler Visitor

## Scope

This phase replaces the CLI manifest terminal's handler-object continuation with one fixed domain operation: `requireCompleteManifest()`. The operation is attached by the CLI terminal factory and is used by scan, sync, and drift-audit consumers.

## Runtime path

`scan/sync/drift audit` → `RouteSyncCliManifestScanOperationInterface.scan(...)` → `controllerInvocationManifestCompositionAuthority.compose(...)` → upstream source discovery/read/identity binding → semantic judgment inventory → manifest builder judgment → CLI terminal factory → `requireCompleteManifest()` → manifest projection or generator.

## Domain contract

- A complete terminal returns the exact upstream manifest.
- A blocked or rejected terminal throws `ControllerInvocationManifestTerminalFailureError` only when the CLI asks for a complete manifest.
- The thrown terminal error retains the original typed judgment in `judgment`; rejection evidence is not replaced with an undefined/null sentinel.
- Core remains independent of CLI terminal error policy. No relation foundation modules were restored.

## Changed files

- `packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
- `packages/cli/src/parsers/php/index.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/commands/scan.ts`
- `packages/cli/src/commands/sync.ts`
- `packages/cli/src/commands/audit/driftAuditor.ts`
- `scripts/audits/audit-phase3100-terminal-manifest-operation.cjs`
- `reports/PHASE3100_TERMINAL_MANIFEST_OPERATION_AUDIT.json`

## Verification boundary

The structural audit checks that the handler visitor contract is gone from active CLI TypeScript sources, all three consumers use `requireCompleteManifest()`, and failure evidence is attached to the terminal error. It does not claim a full typecheck, full test suite, or PHP-to-generator E2E run. Dependencies are not installed in this workspace, so those checks remain unverified.

## Remaining migration

This is a bounded runtime migration, not a repository-wide conversion. Generic continuations remain elsewhere upstream, and the repository-wide export inventory still needs AST-based analysis and incremental migration. Primitive syntax must not be removed mechanically where it represents parser mechanics, type distinctions, or source evidence.
