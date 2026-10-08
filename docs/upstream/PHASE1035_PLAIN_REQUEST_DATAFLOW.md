# Phase 1035 — Plain Request Dataflow Boundary

## Purpose

Extend the Phase 1034 request/assignment/query bridge so ordinary
`Illuminate\\Http\\Request` controller parameters are not silently dropped
when no `FormRequest` contract exists in the source-model request catalog.

## Boundary

The canonical execution contract remains `DataFlowInterface`:

- `seed`
- `derive`
- `close`
- `reaches`

The request projection remains seed evidence only. It does not solve, close,
or classify sources/sinks.

## Change

`semanticDataflowRequestProjection.ts` now has two request evidence paths:

1. `FormRequest` — declared validation fields produce raw → validated →
   controller-request facts.
2. Plain `Request` — controller expression evidence produces field-specific raw
   request identities, or `*` for whole-request access such as `all()`.

An unknown raw field no longer falls back to the first validation field. This
prevents unrelated validated fields from being falsely associated with a raw
request access.

`validated()` and `safe()` remain validated-state evidence only when a matching
validation field exists. A plain `Request` therefore cannot acquire validated
status merely because the expression parser saw a request-like method call.

## Ecommerce evidence

The fixture contains ordinary `Request` parameters in controllers such as
`PromoController`, `ProductReviewController`, `OrderController`,
`PaymentController`, `ProfileController`, `ProdukController`, `WishlistController`,
and `AuthController`, alongside dedicated `FormRequest` classes.

This phase keeps both categories visible to the same downstream dataflow
judgment without creating a second request solver.

## Verification

Structural audits:

- Phase 1033 audit: pass
- Phase 1034 audit: pass
- Phase 1035 plain-request audit: pass

Resolved TypeScript compilation of the modified projection reports no errors
in `semanticDataflowRequestProjection.ts`. Full repository compilation remains
blocked by pre-existing repository/type errors and the checkpoint's missing
runtime dependency installation.
