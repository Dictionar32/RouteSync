# Phase 2733 — Relation Ownership Runtime Migration

## Scope

This phase continues from Phase 2732 and addresses the remaining production-source imports of the deleted `relationFoundation` module. It does not recreate that module under its old name or a replacement name.

## Source changes

- `packages/core/src/semantic/relations/semanticRelations.ts`
  - Owns the explicit relation predicates and branching operations: `relationAny`, `relationAll`, `relationEqual`, `relationNotEqual`, `relationResolve`, and `relationGate`.
  - Owns the tagged `RelationOption` ADT and its `none` / `some` operations.
  - Exposes `semanticRelationOperations: SemanticRelationOperationsInterface = Object.freeze({...})` as the interface-first predicate/branch API.
- `packages/core/src/semantic/relations/relationalSequence.ts`
  - Imports predicates from `semanticRelations` rather than from a foundation module.
  - Converts the exported overload entrypoints `relationSelect` and `relationFirstOption` into interface-typed `export const` operations. Their implementation functions are internal.
- `packages/core/src/semantic/relations/relationMembership.ts` and production/compiler consumers
  - Imports formerly targeting `relationFoundation` now target the semantic relation owner.
  - The membership runtime now calls `semanticRelationOperations.resolve/equal/all`, so the interface-first object is used by real semantic operations rather than existing only as an example.
  - No compatibility foundation or forwarding module was added.
- `package.json`
  - Adds `audit:phase2733-relation-ownership-runtime`.
- `scripts/audits/audit-phase2733-relation-ownership-runtime.cjs`
  - Checks source references, ownership, typed operations, CLI scan/sync path, and manifest ADT variants.

## Upstream CLI → manifest trace

```text
CLI scan / sync
  → manifestScanOperation.scan(input)
  → routeSyncCliManifestScanOperationFactory.create(manifestComposition)
  → controller invocation manifest composition authority
  → canonical project identity / route selection / source discovery
  → source-document identity and inventory judgments
  → upstream manifest builder
  → manifest_builder_complete | manifest_builder_blocked
```

The relation migration does not replace the CLI manifest authority. `complete` and `blocked` remain distinct ADT variants.

## Audit result

Command:

```sh
npm run audit:phase2733-relation-ownership-runtime
```

Result: **10/10 static checks passed**. A targeted TypeScript check for the three relation-owner modules also passed, and compiled runtime smoke checks passed **5/5**.

- `relationFoundation` source references: **0** under `packages/core/src`.
- Original foundation paths: absent.
- Interface-first relation operation object: present.
- Tagged `RelationOption` ADT: preserved.
- `relationSelect` and `relationFirstOption`: no longer exported as function declarations.
- CLI scan and sync still use the manifest scan operation.
- Manifest `complete` and `blocked` variants remain distinct.

## Verification limits and remaining work

The full-project `tsc --noEmit -p tsconfig.json` was attempted but cannot verify this workspace in the current environment: global TypeScript is too old for the configured target/lib, and the workspace lacks `@types/node`, `vitest/globals`, and standard library type definitions. The focused command `tsc --noEmit --target ES2020 --lib ES2020 --module ESNext --moduleResolution node --skipLibCheck` over `semanticRelations.ts`, `relationalSequence.ts`, and `relationMembership.ts` passed. Compiling those three files to CommonJS and exercising equality, selection, option lookup, and membership passed **5/5** runtime smoke checks. Full unit tests, full build, and CLI end-to-end are therefore **not verified**.

A repository-wide relative-import scan still finds 36 unresolved imports in pre-existing paths; the scan is broad and includes unrelated modules/tests. These were not silently counted as passing. Some historical audit scripts also still read deleted `relationFoundation` paths or encode prior-phase reference counts. They need a separate audit-history reconciliation rather than recreating the removed source module.

The scanner/subscanner ownership migration is not complete. This phase removes stale foundation imports from production source; it does not claim that every subscanner is now wiring-only.
