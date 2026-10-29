# Phase 2855 — Fully Typed Runtime Scanner Operations Audit

## Scope and acceptance criteria

This phase audits the runtime route from scanner construction through the upstream manifest builder and CLI scan/sync consumers. Runtime operation exports must be interface-first (`export const operation: ExistingInterface = Object.freeze({...})`), judgments must preserve explicit domain variants, and judgments must expose domain continuation operations rather than data-only payloads. `packages/core/src/types/upstream/collections.ts` remains intentionally empty; this phase does not repopulate it or create a relation/foundation directory.

## Runtime trace

1. `packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts` prepares the upstream scan operation and invokes its manifest scan flow.
2. `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` prepares `ManifestBuilderInput`, executes the Laravel source-AST pipeline, and builds the canonical `RouteSyncManifest` only after the upstream source-model stage completes.
3. `packages/core/src/types/upstream/manifestBuilderInterface.ts` defines the closed `ManifestBuilderJudgment` union: `manifest_builder_complete` or `manifest_builder_blocked` with the blocker stage preserved.
4. `packages/cli/src/manifestScanOperationInterface.ts` defines the CLI-facing scan operation contract; `packages/cli/src/upstreamCompositionInterface.ts` injects it into CLI composition.
5. `packages/cli/src/commands/scan.ts` and `packages/cli/src/commands/sync.ts` request the resolved manifest, validate it, then use `manifestGeneratorOperations.save(...)` and its persistence judgment continuation.
6. `packages/cli/src/generators/ManifestGenerator.ts` owns manifest validation/generation/persistence operations; command modules consume those operations rather than duplicating persistence decisions.

## Changes applied in this phase

- Reworked `packages/core/src/types/upstream/routeDomainAuthority.ts` to remove its imports from `semantic/relations/semanticRelations` and `semantic/relations/relationalSequence`. Route-domain evidence now has named, field-specific ADTs (`RouteDomainDomainEvidence`, `RouteDomainResourceEvidence`, `RouteDomainControllerEvidence`, `RouteDomainPathEvidence`, `RouteDomainActionEvidence`).
- Replaced the generic relation-option helper used by route-domain candidate creation with field-specific candidate operations.
- Added an explicit `RouteDomainCandidateSelection` ADT with `candidate_selected` and `default_applied` variants. Each variant exposes `continueWith` using domain-specific handlers; the resolution judgment also exposes `continueWith`.
- Kept the canonical runtime facade interface-first: `routeDomainAuthority: RouteDomainAuthorityInterface`.
- Updated the route-domain authority test to use local test evidence shapes and added a continuation behavior test.
- Converted the overloaded `typedSelect` runtime export from `export function` declarations to the interface-first `export const typedSelect: TypedSelectOperation = Object.freeze(...)` form. The named interface retains its overload contract.
- Confirmed `packages/core/src/types/upstream/collections.ts` remains 0 bytes.

## Current audit findings

Counts are from the supplied Phase 2854 source snapshot after the Phase 2855 edits:

| Check | Result |
|---|---:|
| TypeScript files under `packages` importing from `semantic/relations` | 306 |
| `semantic/relations` import statements under `packages` | 567 |
| Scanner files importing `semantic/relations` | 41 |
| `types/upstream` files importing `semantic/relations` | 57 |
| CLI source files importing `semantic/relations` | 0 |
| `export function` declarations in scanner, upstream types, and CLI source | 0 |
| `collections.ts` size | 0 bytes |

The relation migration is **not repository-wide complete**. The route-domain authority no longer depends on relation utilities, but 306 files still import `semantic/relations`; many other semantic/scanner authorities require domain-by-domain migration before those imports can be removed safely. This phase does not reintroduce the deleted utility directory or claim those remaining imports have been migrated.

## Verification

- TypeScript syntax transpilation: passed for `routeDomainAuthority.ts`, its route-domain test, and `semanticTypedRelation.ts`.
- Focused `tsc --noEmit` attempt: blocked by existing repository-wide contract failures, including the intentionally empty `collections.ts` and unresolved imports to the absent `semantic/relations` directory. This does not establish a clean typecheck for the whole project.
- Vitest/runtime integration: not verified in this environment.

## TypeScript design references

- Interfaces and function call signatures: https://www.typescriptlang.org/docs/handbook/interfaces
- Discriminated unions: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- Readonly object contracts: https://www.typescriptlang.org/docs/handbook/2/objects

These references support the use of named operation contracts, discriminated ADTs, and readonly properties. They do not imply that the remaining repository migration is complete.
