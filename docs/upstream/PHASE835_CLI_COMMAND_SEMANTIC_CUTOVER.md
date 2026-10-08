# Phase 835 — CLI Command Semantic Cutover

Phase 835 removes the obsolete semantic graph construction from the `scan` and `sync` commands.

## Changes

- `scan.ts` no longer constructs `SemanticKernelV2Impl` or calls `kernel.loadGraph`.
- `sync.ts` no longer constructs `SemanticKernelV2Impl` or calls `kernel.loadGraph`.
- `resolveManifestIncrementally` no longer clones, normalizes, resolves, or rebuilds model/resource/route semantics. It is explicitly a compatibility transport only.
- Existing legacy route helper files remain preserved; they are not deleted.

## Boundary status

The remaining compatibility transport is intentionally not replaced with a new adapter. The next cutover must identify an existing upstream-to-generator contract boundary and wire consumers directly to it.

No new semantic model, resolver, factory, or projection was introduced in this phase.
