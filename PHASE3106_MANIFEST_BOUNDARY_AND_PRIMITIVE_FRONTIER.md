# Phase 3106 — Manifest Boundary and Primitive Migration Frontier

## Objective

Continue the Fully Explicit Simplicity Typed Runtime Scanner migration from Phase 3105. The architectural rule remains **upstream smart, lower layers simple**: domain ADTs own meaningful operations, while CLI owns CLI-specific manifest projection. No deleted relation foundation is restored.

## Real runtime trace

1. CLI `scan` / `sync` command.
2. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` — `controllerInvocationManifestCompositionAuthorityFactory` and `canonicalProjectCompositionOperation`.
3. Upstream source-project identity canonicalization and Laravel controller discovery.
4. Filesystem adapter (`realpath`, `readdir`, `lstat`, `Dirent` classification).
5. Upstream `LaravelControllerSourceDiscoveryResult` operations (`continueCompleteDiscovery`, `includeSource`, `block`).
6. Source read settlement and source-document identity binding.
7. PHP source invocation semantic pipeline and semantic judgment inventory.
8. Manifest preparation, CLI terminal manifest contract, and generator/output consumers.

## Boundary finding

The actual manifest boundary still calls `discovery.continueWith({ onBlocked, onComplete })`. The complete branch continues through `discoveredSourcesContinuationOperation`; the blocked branch passes the original blocked discovery judgment to `sourceDiscoveryBlocked`.

This is intentionally reported as unfinished. The manifest contract belongs to CLI, so importing that contract into `core` to remove the callback would reverse dependency direction. The next valid design is a neutral, upstream-owned projection contract only if it can remove the generic continuation while preserving the exact blocked judgment, partial source inventory, project identity, root, and blocker evidence. Do not replace this with a new generic handler or visitor.

## Repository AST inventory

Run after TypeScript dependencies are installed:

```sh
npm run audit:phase3106-manifest-boundary-and-primitive-frontier
```

The script scans TypeScript under `packages/core/src`, `packages/cli/src`, `packages/sdk/src`, and `packages/react/src`. It inventories export migration candidates and requested primitive/control-flow patterns, then checks the real discovery-to-manifest boundary and dependency direction. Counts are structural findings, not permission to delete syntax mechanically.

Report: `reports/PHASE3106_MANIFEST_BOUNDARY_AND_PRIMITIVE_FRONTIER_AUDIT.json`.

## Next migration batches

- Remove generic continuations from discovery blocker/result ADTs through variant-owned domain operations, migrating their runtime consumers and evidence-preservation tests in the same batch.
- Keep CLI manifest projection in CLI; introduce a core-owned intermediate contract only if dependency direction and all source/blocker evidence remain intact.
- Convert exported functions and exported arrow values to `export const name: Interface = ...` in small, domain-coherent batches.
- Classify `if`, `switch`, equality, ternary, nullish coalescing, `map`, `reduce`, arrays, primitive types, casts, and type predicates by semantic responsibility. Do not remove parser/lexer control mechanics when they are genuinely required to interpret syntax.
- Verify targeted tests, full typecheck, full test suite, and PHP → CLI → manifest → generator E2E before marking a migration complete.

## Verification status

The report is an AST/static audit. It does not claim a full typecheck, full test suite, or end-to-end run. No deleted relation foundation module has been restored.
