# Phase 2910 — Directory classification boundary

## Trace

`controllerSourceDiscovery.discover` → `discoverControllerPhpFiles` → `fs.lstat` / `fs.readdir` → `controllerDirectoryEntryCursorFactory` → `controllerDirectoryEntryClassification.classify` → existing `LaravelControllerSourceDiscoveryEntry.continueDiscovery` → existing `LaravelControllerSourceDiscoveryResult` operations (`includeSource`, `block`, `continueWith`) → manifest composition.

## Contract decision

The existing upstream `LaravelControllerSourceDiscoveryEntry` ADT and `laravelControllerSourceDiscoveryEntryFactory` already model directory, symbolic-link, PHP-source, and ignored entries and provide `continueDiscovery`. Phase 2910 does not introduce a competing upstream ADT. Instead, it makes the Node `Dirent` interpretation an explicitly typed, interface-first CLI boundary operation. The downstream traversal receives the existing domain ADT rather than re-evaluating `Dirent` predicates.

## Scope and limitation

The operating-system boundary must interpret Node's `Dirent` predicates and filename suffix to select a domain variant. This phase confines that interpretation to `controllerDirectoryEntryClassification`; it does **not** claim that all primitive interpretation has been eliminated. Filesystem error normalization and error-code fallback mapping remain open findings. The classifier's fallback is the domain-specific `ignored` entry, and should be reviewed if the discovery policy changes.

`packages/core/src/types/upstream/collections.ts` remains empty. Runtime exports continue to use explicit interface-first `const` declarations; no exported function declaration is introduced.
