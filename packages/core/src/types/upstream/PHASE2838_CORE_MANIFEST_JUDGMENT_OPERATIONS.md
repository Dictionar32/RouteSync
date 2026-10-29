# Phase 2838 — Core Manifest Judgment Operations

## Root cause

`ManifestBuilderJudgment` previously described complete and blocked outcomes as data-only values. Each consumer therefore had to interpret the discriminant itself, duplicating terminal dispatch outside the upstream contract.

## Contract/runtime change

- Reused the existing `ManifestBuilderJudgment` ADT in `packages/core/src/types/upstream/manifestBuilderInterface.ts`; no parallel result contract was introduced.
- Added `ManifestBuilderJudgmentHandlers<Result>` and `continueWith` to complete, source-AST-blocked, and source-model-blocked terminals.
- The manifest builder binds each terminal's continuation to that exact terminal value at the producer boundary. Complete and blocked outcomes remain distinct; blocked evidence is not normalized into an empty or successful manifest.
- `routeSyncManifestScanOperationFactory.create(...).scanFlow` now follows `judgment.continueWith(...)` rather than dispatching on `judgment.kind` downstream.
- Exported the existing contract's handler type through the core barrel. `collections.ts` remains empty.

## Example runtime use

```ts
const flowJudgment = judgment.continueWith({
  onBlocked: blocked => blocked,
  onComplete: complete => Object.freeze({
    kind: 'route_sync_manifest_flow_complete' as const,
    flow: routeSyncManifestFlowProjection.project(complete.manifest),
  }),
});
```

The discriminated terminal owns the continuation operation; consumers supply domain-specific next actions without reimplementing a central switch/if dispatcher. This uses TypeScript's interface-shaped contracts and discriminated unions as documented in the official handbook: https://www.typescriptlang.org/docs/handbook/interfaces and https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html.

## Verification boundary

Run `npm run audit:phase2838-core-manifest-judgment-operations`. This is a structural audit, not a substitute for full typecheck/build/tests. Full project typecheck remains blocked in this workspace snapshot by missing installed type dependencies and a TypeScript compiler that does not support the repository's configured ES2025 target/lib.
