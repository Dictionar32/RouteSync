# Phase 2685 — Runtime Validation Fail-Closed

## Source issue

The standalone CLI imports host-controlled JavaScript. Property access during shape validation can execute getters or Proxy traps. The prior loader caught module import/evaluation failures but did not contain exceptions thrown while validating the imported composition, so the promised loader ADT boundary was incomplete. Structural comparison also recursively traversed arbitrary object graphs without tracking previously compared object pairs.

## Changes

- Structural contract comparison now tracks compared object pairs to avoid unbounded recursion for cyclic graphs.
- The loader catches exceptions from runtime shape validation and returns the existing `composition_module_invalid` ADT variant with `invalid_composition`.
- No fallback composition was introduced. The loader remains fail-closed.
- Phase 2685 audit is registered in the root package scripts.

## Runtime path

`ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` → dynamic import → exact named export `requestTypeDerivationSemanticComposition` → guarded canonical contract/capability validation → CLI assembly → `scan`/`sync` complete-manifest preflight → projection.

The public package specifier is `routesync/upstream`, as declared by the root package `exports` map.

## Verification boundary

Structural audits are run separately. The archive does not claim a successful TypeScript build, Vitest run, package build, or end-to-end CLI execution because `node_modules` and built `dist/upstream.*` artifacts are absent from this extracted workspace.
