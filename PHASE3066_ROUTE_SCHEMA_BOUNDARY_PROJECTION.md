# Phase 3066 — Route Schema Boundary Projection

## Objective

Promote the route-schema handoff from two separately accessed values into one explicit upstream domain operation. The operation carries the canonical schema payload and the exact evidence value together, so route composition does not independently project a payload and then separately reattach provenance.

## Implementation

This Phase 3066 workspace also includes the companion controller-response migration documented in `PHASE3066_CONTROLLER_RESPONSE_PROJECTION_DOMAIN_OPERATION.md`: matched-action response projection now uses the scanner ADT's `continueToResponseProjection(...)` operation rather than checking the scanner result kind in the consumer. Its audit is `audit:phase3066-controller-response-projection-domain-operation`.

- `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts`
  - Adds `RouteRequestSchemaBoundaryProjection<TSourceIdentity>` with `schema` and `schemaEvidence`.
  - Adds `continueToRouteBoundarySchema()` to both available and unavailable schema evidence contracts.
- `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts`
  - Available evidence returns the derived schema with the exact available evidence object.
  - Unavailable evidence returns the canonical empty schema with the exact reason-bearing unavailable evidence object.
- `packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts`
  - `controller_action`, `controller_reference`, and `closure` branches consume the domain projection.
  - The boundary builder no longer calls `continueToSchema()` separately in these branches.
- `scripts/audits/audit-phase3066-route-schema-boundary-projection.cjs`
  - Audits the operation contract, both implementations, all three runtime consumers, blocker propagation, CLI output gates, and workspace invariants.

## Runtime trace

`PHP route/controller evidence → controller-action schema judgment → RouteRequestSchemaEvidence.continueToRouteBoundarySchema() → { schema, schemaEvidence } → RouteBoundaryContract → ManifestBuilderJudgment (complete | blocked) → CLI scan/sync output gate → manifest/IR`.

The projection preserves the distinction between schema payload and evidence status. An empty payload does not establish that schema inference succeeded; unavailable evidence and its reason remain attached.

## Verification

Run both Phase 3066 domain audits (the response audit also reruns the Phase 3065 regression audit):

```bash
npm run audit:phase3066-route-schema-boundary-projection
npm run audit:phase3066-controller-response-projection-domain-operation
```

Latest results: schema boundary projection 17/17; controller response projection 17/17; Phase 3065 regression 14/14.

The audit is structural. Syntax transpilation passed for the three changed TypeScript files. A full PHP fixture through CLI to manifest/IR was not executed. Strict TypeScript validation is blocked before checking the changed files because the workspace lacks ambient type definitions for `chai`, `deep-eql`, `estree`, `fs-extra`, `jsonfile`, `node`, and `react`. Existing missing imports into intentionally deleted relation foundation modules remain unresolved; this phase does not restore them. `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.

## Explicitly not claimed

- No repository-wide elimination of `if`, `===`, `??`, ternary, `map`, `reduce`, `string`, `number`, `boolean`, `null`, or `undefined`.
- No successful end-to-end runtime proof.
- No strict TypeScript pass.
