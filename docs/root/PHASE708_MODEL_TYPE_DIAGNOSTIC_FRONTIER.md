# Phase 708 — Model Type / Diagnostic Frontier

## Build blockers addressed

The reported DTS blockers were structuralized instead of patched around:

- `Sequence<T>.head/tail` in `modelTypeDeriver.ts` now uses the canonical `relationSequenceToArray` relation.
- `PropertyDefinition.origin` is no longer consumed by model semantic lowering. The authoritative `ModelSemanticProperty` closed algebra (`column | accessor | relation`) supplies the property origin.
- `PropertyType` is no longer passed to the semantic-type interner. Its canonical `TypeExpression` witness is lowered through `typeExpressionToSemanticType`.
- Property names retain the existing `PropertyName` value object rather than reconstructing a free string.
- `ValidationParameter` is imported from the canonical domain semantic-value vocabulary.

## Semantic authority

`Laravel source evidence → closed AST semantic judgment → model semantic surface → relational closure → semantic type lowering → rewrite/normalization → Next.js target projection`.

The model type deriver therefore consumes `model.definition.semanticProperties`, not the legacy property-definition surface.

## Diagnostics

The diagnostic layer remains a closed semantic algebra with explicit location/fix state and a `DiagnosticGate` evaluated by `DiagnosticBag`. This phase keeps the diagnostic gate as the first build/semantic boundary before trace and suggestion projections.

## Audit

`npm run audit:phase708:model-type-diagnostic-frontier`

The audit verifies syntax, canonical model semantic surface usage, relation-native sequence traversal, canonical type lowering, absence of the reported legacy property-origin/type paths, closed diagnostic/AST interfaces, and forbidden host constructs in the changed model/request surfaces.

Phase 707 audit remains green as well.

## Remaining frontier

The global migration is intentionally not declared complete. Remaining host-construct hotspots outside this focused frontier still require staged conversion in scanner/lexer, resolver graph, upstream mapping, analysis, semantic type lowering, parser/adapter/generic solver, syntax-error/core/ternary, and related surfaces. Existing empty legacy files remain vacuums rather than being reactivated.
