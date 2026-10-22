# Phase 2139 — Multi-source validation provenance

## Trace finding

`RouteSemanticFlowValidationRuleSet` grouped multiple validation entries into one root field and nested property while exposing only one `source`. The schema retained original `validationEntries`, but field-level provenance was reduced during lowering and was not carried into the upstream `RequestField` projection.

## Change

- `RequestField` and `ValidationFieldProperty` now carry `sources: readonly SourceSpan[]` alongside the legacy primary `source`.
- Root aggregation accumulates every contributing source span in encounter order.
- Nested property merging concatenates provenance from both contributing properties.
- The canonical request AST projection carries `sources` into the upstream `RequestField` contract.
- Schema emptiness now accounts for source-bound validation entries, so evidence is not silently ignored when projected collections are empty.

The singular `source` remains temporarily as a compatibility primary source. `sources` is authoritative for merged fields. Removing the singular compatibility field requires a separate downstream consumer migration and is not claimed here.

## Boundaries not changed

Invocation semantic judgment, integrated response pipeline, runtime executor, and legacy action resolver wiring were not rewritten in this phase. The audit specifically checks provenance ownership and does not claim the full scanner migration is complete.
