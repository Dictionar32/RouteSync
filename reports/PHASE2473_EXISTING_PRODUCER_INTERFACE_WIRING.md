# RouteSync Phase 2473 — Existing Producer Interface Wiring

## Scope

This phase follows the instruction to reuse what already exists. It introduces no new upstream interface, authority, ADT, dependency, or file move. It connects two existing producer implementations to their already-declared producer operation contracts.

## Trace and root cause

- `subscanners/providerProducer.ts` already defines `ProviderProducerInput`, `ProviderProducerResult`, and `ProviderProducer`.
- `subscanners/serviceProducer.ts` already defines `ServiceProducerInput`, `ServiceProducerResult`, and `ServiceProducer`.
- Their canonical implementation helpers were nevertheless exported as positional-parameter functions. The producer boundary then unpacked the existing input contract and called those helpers positionally. This duplicated the boundary shape and left the implementation operation disconnected from its existing interface.

## Changes

- `buildProviderSemanticResultFromSource` is now `export const ...: ProviderProducer['produceResult']`, receives the existing `ProviderProducerInput`, and returns the existing `ProviderProducerResult`.
- `providerProducer.produceResult` passes the existing input object directly.
- `buildServiceProducerResult` is now `export const ...: ServiceProducer['produceResult']`, receives the existing `ServiceProducerInput`, and returns the existing `ServiceProducerResult`.
- `serviceProducer.produceResult` passes the existing input object directly.
- Removed the unused exported `buildProviderAstFromSource` and `buildServiceAstFromSource` helper functions. They had no repository callers and duplicated the AST-only projection already exposed by producer interfaces.
- No files were moved. No interface was added. No `semantic/foundation` dependency was introduced.

## Important boundary

This phase does **not** claim the Laravel scanner is fully interface-first or relation-free. `semantic/relations` imports remain in provider/service canonical implementation files, and other subscanners still contain relation imports and exported functions. Those uses require tracing against existing upstream owners one operation at a time; mechanically replacing relation combinators would not itself transfer semantic authority. Direct `semantic/foundation` imports remain zero under `subscanners` in the Phase 2472 baseline.

## Verification

- The phase audit checks existing interface reuse, object-input wiring, removal of unused helper exports, and absence of newly introduced contract files.
- Full package typecheck, Vitest, build, and CLI end-to-end execution are not claimed by this phase.
