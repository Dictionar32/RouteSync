# Phase 3109 — Upstream Blocker Domain Settlement

## Goal

Continue the upstream-first migration by removing the generic visitor-like continuation from Laravel controller discovery blockers and giving each blocker a fixed domain operation that settles the discovery result.

## Runtime change

`LaravelControllerSourceDiscoveryBlocker` now exposes `blockDiscovery(input)`, with a fixed input contract containing the source-project identity, discovery root, and partial source inventory. The operation creates the blocked discovery judgment while preserving the exact blocker object, source-project identity, root, and partial inventory.

`laravelControllerSourceDiscoveryJudgmentFactory.blockedByFilesystemFailure` now composes the filesystem failure classifier's blocker with `blocker.blockDiscovery(...)`. The upstream blocker owns the domain transition instead of the judgment factory rebuilding the blocked judgment around the blocker.

The prior `LaravelControllerSourceDiscoveryBlockerHandlers<Result>` and `continueWith<Result>` blocker operation have been removed. This is a targeted migration of the blocker ADT, not a claim that all generic continuations in the repository have been removed.

## Runtime trace

`CLI discovery → Node filesystem observation → FilesystemFailureCode.createDiscoveryBlocker → blocker.blockDiscovery({ sourceProject, root, partialSources }) → blocked discovery judgment → CLI manifest projection → terminal manifest → generator/output`.

The core ADT does not import or depend on the CLI manifest. The CLI manifest projection remains at the CLI boundary to preserve dependency direction.

## Evidence-preservation guarantees

- The returned judgment retains the same blocker object.
- The original failure object remains attached to blockers that carry filesystem failure evidence.
- Source-project identity and root remain unchanged.
- Partial source inventory remains unchanged, including sources discovered before the failure.
- Symbolic-link blockers retain their source-file identity without fabricating a filesystem failure payload.

## Verification status

The structural audit is `npm run audit:phase3109-upstream-blocker-domain-settlement`. Syntax transpilation is checked separately. Full typecheck, Vitest, the full test suite, and PHP → CLI → manifest → generator E2E are not claimed unless run successfully in an installed workspace.

## Explicit frontier

Repository-wide export conversion and removal of primitive/control-flow syntax remain incomplete. Phase 3109 does not claim global elimination of `string`, `number`, `undefined`, `null`, `boolean`, `unknown`, arrays, `??`, ternaries, `if`, `===`, `as`, `lookup`, `void`, `visitor`, `switch`, `for`, `map`, or `reduce`. Each migration must preserve PHP/Laravel semantics, provenance, identity, partial inventory, and blocker evidence. Deleted relation-foundation modules remain deleted.

## Repository export frontier (refreshed)

A fresh TypeScript compiler AST scan of `packages/core/src`, `packages/cli/src`, `packages/sdk/src`, and `packages/react/src` reports 2,245 TypeScript files, 520 exported function declarations, 459 exported arrow-variable declarations, and 979 total candidates under the scanner's definition. It detects 51 remaining generic `continueWith<Result>` arrow implementations. The repository-wide conversion is not complete. The inventory is recorded in `reports/PHASE3109_REPOSITORY_EXPORT_MIGRATION_FRONTIER.json`.
