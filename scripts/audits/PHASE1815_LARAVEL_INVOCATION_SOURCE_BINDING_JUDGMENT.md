# Phase 1815 — Laravel invocation source-binding judgment

## Trace inherited from Phase 1814

`ControllerScanner` reads and tokenizes a controller source file, `controllerMethodParser` slices method-body tokens, and `controllerBodyParser` calls `analyzeControllerDataflow`. The current production binding still supplies `php_source_invocation_pipeline_not_connected`. The whole-file PHP source pipeline is composed in the CLI adapter, but the active Laravel scanner does not yet receive its result. Core must not import the CLI package to close this gap.

## Interface-first change

- Added `PhpSourceInvocationSemanticSourceBindingInput`, a closed discriminated `PhpSourceInvocationSemanticSourceBindingJudgment`, and `PhpSourceInvocationSemanticSourceBindingAuthorityInterface` under `core/src/types/upstream`.
- Added `phpSourceInvocationSemanticSourceBindingAuthority`; it compares the controller's `SourceFile` identity with the whole-file pipeline document's `SourceFile` identity. It does not derive or repair invocation semantics.
- Added a distinct source-binding-rejected composition-evidence variant and integrated-response result. A mismatch cannot be mislabeled as `not_connected`, `blocked`, or `complete`.
- Added an exhaustive adapter from the binding judgment to the integrated-response composition evidence. Complete and blocked pipeline results remain their original discriminated variants.
- Advanced the Laravel invocation boundary contract to version 38 and made the upstream source-binding judgment authority explicit.
- Exported the interface and authority from upstream and the public core entrypoint.

## Current limitation (not hidden)

This phase establishes the upstream source-binding judgment and integrated-response representation, but does **not** claim the active controller scanner is wired to it yet. `controllerBodyParser` still uses the disconnected default. The next implementation step is a composition-root-owned per-file carrier: CLI creates one `PhpSourceDocument`, analyzes it once, binds its result to the same canonical `SourceFile`, then passes the closed carrier into the core scanner without introducing a core-to-CLI dependency. Only after that path is validated should the legacy invocation-analysis subscanner path be retired.

## Verification

Run the focused static audits:

- `node scripts/audits/audit-phase1815-laravel-invocation-source-binding-judgment.cjs`
- `node scripts/audits/audit-phase1814-laravel-invocation-interface-first-source-binding.cjs`
- `node scripts/audits/audit-phase1813-laravel-invocation-interface-first-wiring-frontier.cjs`

These are structural source audits, not a TypeScript typecheck, build, or end-to-end test. Those heavier commands were intentionally not run in this environment.
