# Phase 2010 — Pagination Metadata Profile, Interface First

## Trace

Phase 2009 correctly closed the outer `data` / `links` / `meta` envelope only when the payload and resource customization evidence were closed. However, the metadata fields themselves were still assembled by two helper functions directly from `PaginationKind`. That made the framework-default metadata contract implicit, and the parent judgment did not retain a first-class metadata profile as evidence for its projected fields.

## Contract-first change

The existing pagination-envelope sub-contract now owns `LaravelControllerPaginationMetadataProfileInterface`. It is not a new scanner or a parallel response authority. It is a child contract of the existing `LaravelControllerResponsePaginationEnvelopeJudgmentInterface`, which remains owned by `LaravelControllerResponseOutputTypeJudgmentInterface`.

The profile receives the canonical `PaginationKind` ADT and the exact method `SourceSpan`. Its proven judgment carries:

- the canonical pagination variant;
- typed `links` and `meta` structures;
- the exact source span used as field provenance;
- an explicit framework contract identifier, `laravel-paginated-resource-response-default-metadata-v1`.

The contract explicitly states that metadata fields are derived from the canonical pagination ADT under a versioned framework-default contract, not inferred runtime values. This distinction matters: RouteSync can prove the *shape contract* under known framework behavior; it is not claiming to know runtime paginator values.

## Integration

`judgePaginationEnvelope` now delegates `links` and `meta` construction to the metadata profile interface and retains the proven profile in the envelope judgment. The output-type judgment continues to project the resulting closed `TypeExpression` into `ResponseDefinition` and `ResponseAst` through the existing method projection interface.

The envelope authority only invokes this profile after its existing resource-closure checks have accepted the payload and ruled out resource-level or collection-level `paginationInformation`, `with`, `withResponse`, and response customization. Thus the child profile does not independently reinterpret customization evidence.

The response pipeline contract advances to version 13, the output-type contract to version 4, and the pagination-envelope contract to version 2. The metadata profile contract is version 1.

No `relation` or `foundation` subscanner was added. Existing legacy references elsewhere in the repository are not claimed to have been removed.

## Verification limits

The Phase 2010 audit checks contract ownership, profile retention, pagination variant coverage, field provenance, customization gating, and the existing response/AST projection path. Syntax transpilation is not a full project typecheck. Full build/typecheck is not claimed to pass.

## Official references

- Laravel's `PaginatedResourceResponse` API documents framework pagination links and metadata and its `paginationInformation` customization point.
- TypeScript's official handbook documents discriminated unions and exhaustiveness, which support the closed `PaginationKind` and profile judgment ADTs.
