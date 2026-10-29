# Phase 3065 — Route Schema Evidence Domain Continuation

## Objective

Move the controller-reference route projection onto the schema evidence ADT's existing domain operation instead of calling a generic continuation visitor whose available and unavailable handlers performed exactly the same operation. Preserve the evidence object separately from the projected payload.

## Runtime path

`PHP route/controller reference → controller/action correlation → RouteRequestSchemaEvidence → continueToSchema() → RouteBoundaryContract(schema + schemaEvidence) → manifest builder → CLI scan/sync`.

## Change

In `packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts`, the controller-reference branch now sets `schema: schemaEvidence.continueToSchema()` and still publishes the original `schemaEvidence` on the route boundary contract. The ADT owns schema projection for both available and unavailable evidence; the consumer no longer repeats a same-result branch through `continueWith`.

## Verification

Run `npm run audit:phase3065-route-schema-evidence-domain-continuation`. The audit checks 14 structural conditions, including source identity/schema origin retention, explicit unmatched/ambiguous/invalid correlation outcomes, blocked manifest propagation, CLI output gates, the deleted-relation invariant, and the protected one-byte newline file.

## Honest limitations

- This is a focused domain-continuation migration, not global removal of `if`, equality checks, nullish coalescing, ternaries, `map`, `reduce`, or primitive types.
- An unavailable schema still projects the canonical empty payload, but the route boundary retains the unavailable evidence and reason. It must not be interpreted as evidence that a schema was successfully inferred.
- The structural audit is not an executed PHP → CLI → manifest/IR integration test. End-to-end fixture and strict TypeScript validation were not run in this phase.
- Deleted relation foundation modules remain absent; `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
