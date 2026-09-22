# Phase 26 — Resource/Request Semantic Field Boundary

## Scope
Upstream interface only. No downstream flow migration.

## Trace finding
`ResourceField` and `RequestField` were lower-level contracts while `highLevelContracts.ts` separately defined richer `ResourceFieldSemantic` and `RequestFieldContract`. This created two competing representations of the same field and allowed consumers to receive syntax/type/presence first, then re-classify meaning/target themselves.

## Repair
`ResourceField` now carries `ResourceFieldMeaning` directly:
- property projection
- relation projection
- computed projection

`RequestField` now carries `RequestFieldTarget` directly:
- input property
- input collection

The old high-level vocabulary is now a facade/re-export of the canonical upstream field semantics instead of a second source of truth.

`ResourceSemanticNode.fields` and `RequestSemanticNode.fields` now reference canonical upstream `ResourceField` / `RequestField`.

## Principle
A field entering downstream must already state what it means and what it targets. Downstream must not reconstruct field meaning from expression shape, names, or validation rules.
