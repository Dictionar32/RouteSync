# Phase 3120 — Entry-Owned Runtime Continuation Migration

## Runtime path changed

`Node fs.Dirent` → `controllerDirectoryEntryClassification` in the CLI composition root → `LaravelControllerSourceDiscoveryEntry` in `core/src/types/upstream` → the bound domain operation → the existing discovery judgment → recursive source discovery / source inclusion / blocked judgment → the existing manifest projection.

## What changed

The upstream entry ADT no longer requires a `LaravelControllerSourceDiscoveryEntryHandlers` visitor at the point of continuation. Each entry factory now binds a domain-specific continuation operation when the entry is created:

- directory entry: `discoverNestedDirectory`
- symbolic-link entry: `blockUnresolvedSymbolicLink`
- PHP source entry: `includePhpSource`
- ignored entry: `preserveDiscoveryJudgment`

The resulting ADT exposes `continueDiscovery()` with no visitor argument. The CLI binds each operation to the already-existing source discovery operation or judgment operation. The four entry variants and their source identity remain intact; symbolic links still block complete discovery, PHP files still enter the source inventory, ignored entries preserve the current judgment, and nested directories continue through the same source reader.

## Ownership boundary

`Dirent` facts remain interpreted at the CLI filesystem adapter. The core upstream ADT owns the follow-up domain operation, but does not import Node filesystem types or CLI manifest types. No generic relation foundation is recreated.

## Verification

Run `node scripts/audits/test-phase3120-entry-owned-runtime-continuation.cjs`. This CJS/TypeScript-AST gate checks the real CLI-to-upstream wiring and parses all package TypeScript files. It is a static contract check, not a substitute for a full TypeScript typecheck or end-to-end test.

## Remaining migration scope

This phase migrates one coherent runtime slice only. Repository-wide export conversion and global elimination of primitive operators/control flow are not complete. Platform classification still contains a candidate-selection expression and directory traversal still has its own cursor operation; these remain separate migration targets and must not be mechanically rewritten if doing so would erase source semantics.
