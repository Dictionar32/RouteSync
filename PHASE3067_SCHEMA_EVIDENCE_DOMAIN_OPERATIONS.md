# Phase 3067 — Route Schema Evidence Domain Operations

## Why this phase exists

Phase 3065 only shortened a consumer call. That did not remove the generic abstraction from the upstream schema-evidence ADT. Phase 3067 addresses the actual contract: `RouteRequestSchemaEvidenceHandlers<TSourceIdentity, Result>` and `continueWith<Result>` are removed from the available/unavailable route schema evidence variants.

## Change

- `ControllerActionSchemaRouteRequestEvidence` and `RouteRequestSchemaEvidenceUnavailable` both expose the domain-owned `continueToRouteBoundarySchema()` operation.
- The available constructor projects its canonical schema together with the exact available evidence object, retaining source identity and schema origin.
- The unavailable constructor projects the canonical empty schema together with the exact reason-bearing unavailable evidence object.
- The old generic callback contract is removed from the interface and constructors.
- The focused regression test now verifies the domain projection directly, including evidence identity, source identity, schema origin, and unavailable reason.
- Route composition continues to consume the single projection; it does not independently reconstruct availability from a `kind` check.

## Runtime trace

`Laravel PHP route/controller source → controller/action correlation → ControllerActionSchemaSemanticJudgmentAuthority.judge → RouteRequestSchemaEvidence (available | unavailable) → continueToRouteBoundarySchema() → RouteBoundaryContract(schema + exact evidence) → ManifestBuilderJudgment(complete | blocked) → CLI scan/sync gate → manifest/IR output`.

## Audit

Run:

```bash
npm run audit:phase3067-schema-evidence-domain-operations
```

The structural audit includes the Phase 3066 boundary projection regression, verifies the removed generic API, evidence/provenance preservation, the blocked manifest gates, absence of the deleted relation foundation files, and the protected one-byte `collections.ts` invariant.

## Limits

This phase does not claim global removal of `if`, `===`, `??`, ternary, `map`, `reduce`, primitive types, or generic continuation APIs elsewhere. It does not claim a full strict TypeScript pass or an executed PHP-to-CLI-to-manifest/IR end-to-end fixture.
