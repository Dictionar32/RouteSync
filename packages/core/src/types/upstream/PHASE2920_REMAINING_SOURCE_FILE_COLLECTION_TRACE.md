# Phase2920 — Remaining upstream source-file collection trace

## Scope

Trace the remaining `readonly SourceFile[]` contracts after Phase2918/2919. This phase deliberately does **not** mechanically replace arrays: the remaining contracts represent different domain responsibilities and need separate closure semantics.

## Findings

| Contract | Current responsibility | Runtime consumer / producer trace | Recommendation |
|---|---|---|---|
| `LaravelRouteSourceSelection` (`laravelRouteSourceSelection.ts`) | Explicit user-selected route-file intent | CLI `scan.ts` and `sync.ts` call `laravelRouteSourceSelectionAuthority.explicitFiles([createSourceFile(...)])`; `laravelRouteScanner` resolves selected files; `routeDeclarationComposition` turns absent explicitly selected files into `laravel_route_scan_blocked` | Do not replace with `SourceFileInventory` alone until selection semantics and the distinction between project defaults vs explicit selection are retained. Consider a domain-owned `ExplicitRouteSourceSelection` operation contract. |
| `LaravelRouteScannerInterface` (`laravelRouteScannerInterface.ts`) | Route-scan selected files, missing-file evidence and blocked result | `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` calculates `selectedFiles` and `missingFiles`; `routeDeclarationComposition.ts` produces source observations or a blocked judgment | This is not merely an inventory: missing files are correlated to explicit selection and become a terminal blocked judgment. Model the selection and missing-file correlation as domain operations before changing the payload type. |
| `ControllerDeclarationSemanticJudgmentInterface` (`controllerDeclarationSemanticJudgmentInterface.ts`) | Candidate evidence for ambiguous parent-controller resolution | `controllerDeclarationSemanticJudgmentAuthority.ts` emits `parent_ambiguous_in_inventory` with candidate files; tests inspect the ambiguity judgment | Candidates are ambiguity witnesses. Preserve the witness set and ambiguity meaning; do not collapse it into a generic file inventory without an explicit domain operation for candidate resolution. |
| `LaravelControllerResponseDtoDeclarationInterface` (`laravelControllerResponseDtoDeclarationInterface.ts`) | Complete and partial DTO declaration discovery receipts | `packages/core/src/compiler/scanner/operations/dtoAstCanonical.ts` gathers source files and emits complete/incomplete discovery evidence; incomplete evidence retains partial source discovery and blockers | This is a discovery receipt with closure/blocker semantics, distinct from the CLI manifest inventory. Reuse a common inventory only if the receipt still owns completion, partial evidence, and blocker relationships. |

## Manifest path boundary

The Phase2918 `SourceFileInventory` change is retained on the traced controller-invocation manifest path. The four contracts above are adjacent upstream concerns, not proof that the manifest path still has `SourceFile[]`. They must not be bulk-migrated merely to reduce a textual array count.

## Generic continuation debt — resolved in Phase2921

Phase2920 identified `SourceFileInventory.continueWith<Result>` as a generic elimination candidate. Phase2921 replaces it with the core-owned `SourceFileInventoryVisitorInterface` and `visitSources(visitor)`. The visitor reports each `SourceFile` to the caller without exposing a generic result type or depending on CLI settlement types. The CLI schedules reads in visitation order and `Promise.all` preserves that order in the returned settlements. See `PHASE2921_SOURCE_FILE_INVENTORY_DOMAIN_VISITOR.md`. This resolves the generic continuation debt for `SourceFileInventory` only; it does not claim to remove generic continuations from unrelated upstream ADTs.

## Runtime export rule

For changed runtime operations, retain the established form `export const operation: ExistingInterface = Object.freeze({...})`. Do not introduce `export function` declarations or a helper interface whose only purpose is to hide primitive branching. Existing upstream contracts must be reviewed before proposing any new contract.

## Validation limits

The accompanying audit script checks source declarations, consumer trace anchors, interface-first source selection, blocked-state preservation, and the empty `collections.ts` invariant. It is a structural audit only; it does not establish TypeScript typecheck, build, unit-test, or E2E success.
