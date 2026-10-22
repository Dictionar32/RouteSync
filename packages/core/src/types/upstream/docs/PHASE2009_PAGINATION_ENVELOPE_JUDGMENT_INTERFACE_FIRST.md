# Phase 2009 — Pagination Envelope Judgment, Interface First

## Trace

Phase 2008 left every `ResponseJsonShape.paginated` unresolved because the output-type authority did not own a typed framework-envelope contract. The existing canonical `ResponseResult` already carries a discriminated `PaginationKind`, and the response pipeline already receives resolved resource definitions. The missing contract is the projection from that canonical input to the framework-owned `data`, `links`, and `meta` output shape.

## Contract-first change

The existing `LaravelControllerResponseOutputTypeJudgmentInterface` now owns a `paginationEnvelope` judgment interface. It is a sub-contract of the existing output-type authority, not a second response authority or scanner. The input carries the exact canonical `ResponseResult`, resolved `ResourceDefinition` inventory, and method source span for provenance of framework-owned envelope fields.

The pagination judgment returns a closed ADT:

- `controller_response_pagination_envelope_proven`
- `controller_response_pagination_envelope_unresolved`

The proven output is a typed object with `data`, `links`, and `meta`. Its payload type must already be proven from the canonical response payload. The pagination discriminant determines the corresponding page metadata fields; it is not inferred from source syntax. The parent output-type judgment preserves the pagination sub-judgment's unresolved reason instead of collapsing it into a generic `mixed`-type diagnosis.

## Resource customization closure

For resource payloads, the canonical resource definition must be unique and closed. Dynamic entries, resource response customization, `with`, `withResponse`, resource-level `paginationInformation`, or collection-level `paginationInformation` prevent the envelope from being declared proven. Unknown payloads remain unresolved. This avoids claiming a framework-default envelope when the source explicitly customizes it.

## Integration

`projectResponseResultOutputType` delegates the paginated branch to the interface-owned `paginationEnvelope` judgment. The existing output-type judgment then carries the resulting `TypeExpression` into the existing method AST projection and `ResponseDefinition.output`. The scanner still consumes canonical method response products and does not reparse or reclassify PHP return syntax.

No `relation` or `foundation` subscanner was added. Existing legacy references elsewhere in the repository are not claimed to have been removed.

## Verification limits

The Phase 2009 audit is structural and contract-focused. Syntax transpilation reports no diagnostics for the two modified TypeScript files. A targeted TypeScript check still reports unrelated existing diagnostics elsewhere in the dependency graph; full project typecheck and build are not claimed to pass.

## Official references

- Laravel's official Eloquent resources documentation describes the paginated `data`, `links`, and `meta` envelope and its `paginationInformation` customization point.
- TypeScript's official handbook describes discriminated unions and exhaustive handling, which informs the closed pagination-kind ADT.
