# Phase2919 — Fully Typed Runtime Scanner Operations: CLI Manifest Trace

## Scope and method

This phase continues from Phase2918 and audits the actual upstream CLI manifest construction path. It does not mechanically rewrite unrelated route-scanner, DTO, or controller-declaration contracts merely because they also contain `SourceFile[]`. The governing rule remains: inspect the existing contract and its callers first; evolve the contract that owns the domain rather than introducing a parallel generic abstraction.

## Runtime trace

1. CLI `scan` / `sync` command obtains `composition.manifestScanOperation` and invokes `.scan(input)`.
2. `routeSyncCliManifestScanOperationFactory.create(...)` adapts the CLI operation to `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)`.
3. `controllerInvocationManifestCompositionAuthority` canonicalizes source-project identity, then invokes the existing `LaravelControllerSourceDiscoveryInterface` contract.
4. Discovery completion is consumed through its domain continuation. The discovered source inventory is `SourceFileInventory`, not `SourceFile[]`.
5. `discoveredSourceReadSettlementOperation.readAll` traverses that inventory and initiates source-document reads. Read settlements are passed through the existing source-identity binding and PHP source read-batch contracts.
6. Semantic judgment preparation consumes the read batch; inventory authority closes source/judgment correspondence and preserves duplicate/missing/multiply-judged evidence as typed inventory results.
7. The manifest builder's complete/blocked judgment controls publication. The terminal manifest ADT exposes `continueForDriftAudit`; a blocked construction must not be reinterpreted as an empty successful manifest.
8. CLI terminal commands format source-file evidence through `SourceFileInventory.format(...)` instead of projecting a raw array for display.

## Runtime contract audit

- The production entrypoints in the traced CLI manifest path use interface-first object exports, e.g. `export const controllerInvocationManifestBuilder: ControllerInvocationManifestBuilderInterface = Object.freeze({...})` and `export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface = Object.freeze({...})`.
- The traced runtime path contains no `export function` declaration.
- The Phase2918 source inventory change is present at the upstream ownership boundary: `SourceFileInventory` has `include`, `filter`, `countMatching`, `format`, and `continueWith` operations; the CLI does not own the inventory's storage protocol.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- The existing manifest terminal ADT remains the publication boundary; this phase does not create a duplicate manifest-result ADT.

## Important design debt (not hidden)

`SourceFileInventory.continueWith` currently has a generic result parameter. It is an explicit ADT eliminator used for distinct domain continuations (source-read settlement, rejection collection, and formatting), but it does not satisfy the strictest interpretation of “no generics.” Removing it safely requires replacing each call site with a domain-owned operation and proving that no downstream primitive branch or generic collection helper is reintroduced. This phase records that as a follow-up instead of disguising it with another generic wrapper.

Other upstream contracts outside the traced manifest construction path still declare `SourceFile[]` (including route scanner/source selection, controller declaration ancestry, and DTO discovery). They are intentionally not bulk-replaced here: their domain semantics and callers must be traced before deciding whether `SourceFileInventory` is appropriate or a distinct domain ADT is required.

## Validation boundary

Run `node scripts/audits/audit-phase2919-upstream-cli-manifest-runtime.cjs` from the repository root. The audit is structural and checks the runtime trace, interface-first entrypoints, source inventory integration, and empty `collections.ts` invariant. It is not a substitute for a full TypeScript typecheck, build, unit test suite, or E2E run; none of those are claimed by this report.
