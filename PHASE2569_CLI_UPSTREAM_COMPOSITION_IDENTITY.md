# RouteSync Phase 2569 — CLI Upstream Composition Identity

## Root cause

Phase 2568's resolution contract accepted `pipeline?` and returned one unavailable variant named `production_composition_missing`, while the actual CLI boundary passed `composition?.requestTypeDerivationPipeline`. This collapsed two distinct concepts: an absent CLI host composition and the semantic capabilities required inside a production pipeline. It also allowed an optional pipeline value to cross a semantic resolution API instead of an explicit typed request.

## Change

- Added `RequestTypeDerivationSemanticPipelineResolutionInput` to `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- Changed the resolver input from an optional pipeline to a closed ADT: `request_type_semantic_pipeline_supplied` or `cli_upstream_composition_missing`.
- Changed the unavailable output to identify the actual missing composition members: manifest composition and RequestType semantic pipeline.
- Evolved the resolution contract version from 1 to 2.
- Updated `scan` and `sync` to pass an explicit resolution ADT before source acquisition.
- Kept the compatibility guard, but made it delegate through the new explicit input contract.
- Updated historical audit expectations and added `audit:phase2569-cli-upstream-composition-identity`.

## Path

`CLI host composition → explicit resolution input ADT → available pipeline | terminal missing-composition ADT → source acquisition only when available → manifest composition → semantic projection`.

## Important boundary

This change does **not** implement the missing production RequestType reasoning/verifier/decision/authority capabilities. It removes an ambiguity in the boundary and makes the actual absent host composition explicit. It does not pretend a production semantic pipeline exists or enable a legacy fallback.
