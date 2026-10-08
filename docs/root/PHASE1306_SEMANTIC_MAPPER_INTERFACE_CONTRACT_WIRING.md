# Phase 1306 — Semantic Mapper Interface / Contract / Wiring

## Objective

Raise mapper semantics from generator-local `MappingIntent` reconstruction to a proof-carrying upstream contract.

## Trace

```text
Laravel route/controller/request/resource/model evidence
  -> semantic type / response contract
  -> SemanticReasoningContract
  -> SemanticMappingContract / MapperContract
  -> ResourceMappersArtifact
  -> MapperProjectionInterface / MapperWiringInterface
  -> MapperGeneratorPass / MapperProjector
  -> mappers/api-mapper.ts
```

## Changes

- Added `types/upstream/semanticMapping.ts`.
- Added explicit `SemanticMappingContractInterface` and consumer surface.
- Added `MapperContract`, `MapperInterface`, `MapperConsumerInterface`, and `MapperWiringInterface`.
- Added `types/interfaces/mapperProjectionInterface.ts` as the explicit upstream-to-downstream projection boundary.
- Reworked `ResourceMappersArtifact` into a closed semantic mapping carrier; it no longer carries generated mapper bodies.
- Added `semanticMappingDeriver.ts` as the upstream mapping authority.
- Changed `MapperGeneratorPass` input from `RequestTypesArtifact` to `ResourceMappersArtifact`.
- Changed `MapperProjector` to consume `ResourceMappersArtifact`.
- Changed mapper read/form builders to render already-resolved semantic fields and names only.
- Changed generated mapper artifact lineage from `RequestTypes` to `ResourceMappers`.
- Added `semantic-mapper-contract-phase1306.cjs` audit.
- Updated `routesync-architecture.cjs` stale Phase 1305 reasoning-interface assertions to the current producer/consumer contract model.
- Updated `Engine.Fix.md` with the mapper boundary and remaining SDK payload-mode frontier.

## Invariants

1. Mapper generation does not call `resolveMappingIntent`.
2. Mapper generation does not derive resource aliases or response cardinality.
3. Mapper generation does not derive frontend property naming.
4. Mapper generation does not derive mapper function names.
5. Mapper generation does not derive form API field keys.
6. Semantic reasoning proof crosses the mapper boundary unchanged.
7. ResourceMappers is an upstream semantic artifact; GeneratedMapper is downstream source projection.

## Audit

- `semantic-ownership-coverage`: PASS 33/33
- `semantic-interface-contract-phase1305`: PASS 14/14
- `semantic-mapper-contract-phase1306`: PASS 12/12
- `routesync-architecture`: PASS 129/129

## External architecture alignment

MLIR interfaces support generic analyses/transforms without hard-coding concrete operation/dialect semantics. CodeQL separates data-flow engine behavior from semantic source/sink/configuration. TypeScript structural interfaces provide the contract mechanism used by RouteSync. Axios remains transport/runtime, TanStack Query consumes typed query contracts, Zod remains a target schema projection, and Next.js Route Handlers remain target HTTP projections.

## Remaining frontier

`packages/sdk/src/api-runtime/optionSplitter.ts` still chooses body/query from HTTP method. The next semantic elevation should project `RouteExecutionSignature` (or a dedicated request payload-mode capability) into the runtime endpoint contract and make `optionSplitter` consume that closed capability rather than reclassifying method semantics.
