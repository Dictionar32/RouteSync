# Phase 2768 — Fix the collection representation at its source

## Root cause addressed

The previous manifest lowering code converted `Sequence<T>` into arrays and the source-AST pipeline converted arrays back into `Sequence<T>`. That was a contract mismatch, not merely a helper naming problem.

## Contract changes

- `Discovered<T>.discovered_many.items` is now `readonly T[]`.
- `laravelSourceAstPipeline` publishes discovery arrays directly; its generic `sequence()` and `sequenceToArray()` round-trip was removed.
- Attribute scan evidence is projected directly into an array without manufacturing the generic `Sequence<T>` collection.
- Resource scan response artifacts are represented as readonly arrays end-to-end; `sequenceFromArray` was removed from the resource scanner.
- `ChannelDefinition.parameters` is a readonly array, and the channel producer preserves that array shape.
- Manifest lowering and projection inputs consume discovery arrays directly. Neither module imports or calls `Sequence`, `sequenceToArray`, or `discoveredMany`.

## Scope boundary

This phase removes `Sequence` from the discovery/resource/channel-to-manifest collection path described above. The repository still uses `Sequence` in other semantic structures (for example expression arguments, controller policy, and relation paths); those are separate contracts and were not silently rewritten in this phase.

## Verification

Run `npm run audit:phase2768-source-contract-array-collections`. This is a targeted source-contract and TypeScript syntax audit, not a full semantic typecheck. A full `tsc --noEmit` attempt was blocked by the checkout's TypeScript environment: missing standard global/type definitions (`node`, `vitest/globals`) and an incompatible compiler/config combination. No claim is made that the complete repository typecheck or end-to-end test suite passed.
