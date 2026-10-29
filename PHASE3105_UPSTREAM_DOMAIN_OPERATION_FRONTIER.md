# Phase 3105 — Upstream Domain Operation Frontier

## Goal

Continue the `Fully Explicit Simplicity Typed Runtime Scanner Operations` migration from Phase 3104. The principle remains: **upstream owns domain knowledge; lower layers orchestrate typed operations**. This phase strengthens evidence-preservation regression coverage and creates a repeatable AST inventory for the next migration batch.

## Implementation

Expanded `packages/core/src/types/upstream/__tests__/laravel-controller-source-discovery-complete-operation.phase3104.test.ts` with regression checks proving that:

- `includeSource` adds the source while retaining the exact project identity and discovery root.
- `block` preserves the original project identity, root, already-discovered source inventory, and blocker object.
- The tests cover data provenance as well as the discriminated result kind.

The existing `continueCompleteDiscovery` operation remains the upstream-owned continuation for complete discovery. The CLI still owns conversion of discovery outcomes into `ControllerInvocationManifest`; moving that manifest projection into `core` would reverse the dependency direction. That remaining cross-layer boundary is explicitly reported rather than disguised as a completed migration.

## Repeatable AST audit

Run after dependencies are available:

```sh
npm run audit:phase3105-upstream-domain-operation-frontier
```

The audit scans TypeScript source under `packages/core/src`, `packages/cli/src`, `packages/sdk/src`, and `packages/react/src`. It records exported function/arrow candidates and structural counts for selected control-flow/operator patterns. Counts are evidence for domain-by-domain migration, not an instruction to delete syntax mechanically.

Report: `reports/PHASE3105_UPSTREAM_DOMAIN_OPERATION_FRONTIER_AUDIT.json`.

## Verification limits

The regression tests were added but the full Vitest suite, full repository typecheck, and PHP → CLI → manifest → generator end-to-end flow have not been verified in this environment. Do not interpret AST inventory or syntax checks as a passing integration test.

No deleted relation foundation module has been restored.
