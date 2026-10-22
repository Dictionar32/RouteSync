# RouteSync Phase 2616 — Narrow Upstream Composition Surface

## Objective

Separate the CLI host-composition boundary from the broad `@routesync/core` public barrel. The composition loader and factory need the canonical RequestType derivation contract and its assembler, not the whole Core public surface.

## Changes

- Added `packages/core/src/upstream.ts` as a narrow upstream entrypoint. It re-exports the existing canonical contract, pipeline interfaces/ADT, and production assembler; it does not introduce new semantic contracts or implementations.
- Added the `@routesync/core/upstream` TypeScript path mapping.
- Added `upstream` as a build entry beside the existing `core` entry, so declarations can target a dedicated surface.
- Updated `standaloneCompositionLoader.ts` and `upstreamCompositionFactory.ts` to consume the narrow entrypoint.
- Updated declaration import rewriting so `@routesync/core/upstream` is rewritten to the emitted `upstream` declaration entry.
- Added `audit:phase2616-narrow-upstream-composition-surface`.

## Validation

`node scripts/audits/audit-phase2616-narrow-upstream-composition-surface.cjs`: **8/8**.

`audit-phase2614-manifest-upstream-contract-alignment.cjs`: **7/7**.

`audit-phase2613-cli-manifest-upstream-path.cjs`: **14/14**.

The Phase 2616 graph explicitly excludes type-only imports from the runtime dependency closure. It reaches 21 source files and zero `semantic/relations` or `semantic/foundation` modules for the two host-composition entry files.

## Remaining boundary

This does **not** claim the entire CLI or the entire Core barrel is free of relation dependencies. The broad CLI still has existing relation helpers in parser/AST and graph paths. Phase 2615 remains a separate, deliberately failing whole-CLI/core-barrel boundary audit at 6/7. The next work must migrate each remaining runtime consumer to its proper owner or narrow entrypoint, preserving behavior and interface contracts; do not weaken the audit.

## Semantic production status

The narrow surface only improves module ownership and dependency closure. It does not implement production semantic reasoning or the independent verifier for all canonical derivation laws. Those remain explicit upstream implementation blockers, and the CLI must continue to fail closed when the host does not provide them.
