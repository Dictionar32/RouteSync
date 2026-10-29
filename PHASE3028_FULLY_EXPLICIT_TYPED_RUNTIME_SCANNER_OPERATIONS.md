# Phase 3028 — Fully Explicit Typed Runtime Scanner Operations

## Real upstream → CLI → manifest path

The audited runtime chain remains the production chain, not a parallel foundation:

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the interface-backed CLI manifest scan operation.
2. The CLI delegates into `ControllerInvocationManifestCompositionAuthorityInterface.compose`.
3. Composition runs upstream source discovery, source-file identity binding, PHP/Laravel invocation evidence extraction, semantic judgments, validation, and manifest preparation.
4. Source occurrence and semantic dataflow consumers use the upstream provenance model to correlate evidence without dropping source-file identity.
5. The manifest terminal judgment retains complete/blocked/rejected outcomes for downstream continuation.

## Implemented

- `laravelControllerActionRouteCorrelationAuthority.ts` now delegates source-span equality to `sourceSpanOperations.same` instead of repeating file/start/end comparisons.
- `semanticDataflowControllerQueryProjection.ts` uses the same canonical operation when matching query expression evidence to a dataflow source identity.
- `semanticDataflow.ts` semantic identity equality delegates span equality to the upstream provenance ADT, while retaining role and slot checks as semantic identity dimensions.
- Added `audit:phase3028-source-span-identity-consumers` and its machine-readable audit report.

These are consumer migrations: domain meaning is centralized in an existing upstream ADT. No generic relation foundation was restored and no second source of truth was added.

## Explicit typing boundary

The intended implementation shape is `export const operation: OperationInterface = Object.freeze({ ... })`, with closed judgments and explicit domain operations. The selected operations already follow this pattern. This phase does **not** mechanically rewrite every exported function in the repository, nor does it pretend raw parser offsets can cease to exist at the PHP parser boundary. Numeric offsets still need a later dedicated source-position model, and remaining direct comparisons must be migrated by actual type and runtime ownership.

TypeScript's official documentation supports interface-shaped contracts and discriminated unions as ways to encode distinct outcomes; it also documents that ordinary control-flow checks are used for type narrowing. Therefore the architectural goal is not to delete every `if` or `===` blindly: semantic decisions should move to upstream judgments, while parser-boundary decoding and unavoidable dispatch remain explicit. See [TypeScript interfaces](https://www.typescriptlang.org/docs/handbook/interfaces) and [TypeScript narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing).

For the framework trace, Laravel's route model binding documents that route URI segments and controller type-hinted models participate in runtime resolution. The scanner should preserve that source evidence and correlation rather than replacing it with inferred strings or lossy booleans. See [Laravel routing documentation](https://laravel.com/framework/docs/6.x/routing).

## Validation

Run:

```bash
npm run audit:phase3028-source-span-identity-consumers
npm run audit:phase3027-source-span-consumer-domain-migration
npm run audit:phase3026-source-span-domain-operations
npm run audit:phase3025-statement-index-domain-operations
```

The Phase 3028 audit checks only the migrated contracts, prior span tests, the removed-relation constraint, and the `collections.ts` one-newline sentinel. Full typecheck, Vitest, and CLI→manifest end-to-end tests are not claimed as passed in this environment.

## Remaining debt

- Migrate additional `SourceSpan` consumers and construction sites in vertical slices.
- Introduce a source-position domain representation above parser offsets; do not just wrap `number` without operations.
- Continue auditing `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, empty arrays, `??`, ternaries, traversal arithmetic, and exported functions across the actual runtime path.
- Preserve source identity, provenance, syntax evidence, inferred type facts, and blocker judgments on every migration.
- Keep deleted relation foundations absent and `packages/core/src/types/upstream/collections.ts` exactly one newline byte.
