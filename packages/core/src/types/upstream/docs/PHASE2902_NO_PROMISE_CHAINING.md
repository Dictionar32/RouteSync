# Phase 2902 — Remove Promise.then/reduce from discovery traversal

## Review correction

Phase 2901 used `orderedEntries.reduce((pendingEvidence, entry) => pendingEvidence.then(...))` to sequence filesystem discovery. Although it avoided mutable accumulators, it obscured the control flow behind promise chaining and reduce. That was not the clearest fit for the requested Fully Typed Runtime Scanner Operations style.

## Change

The discovery traversal now uses a direct asynchronous recursive operation over the remaining directory entries. It calls the existing `LaravelControllerSourceDiscoveryResult.continueWith` operation to continue complete evidence or return blocked evidence. It does not add a generic collection ADT or another generic helper abstraction.

The iterator's `done` discriminator represents list exhaustion; this is structural iteration state, not a domain result. Filesystem entry classification remains at the filesystem adapter boundary. Immutable source snapshots are retained, and blocked outcomes preserve partial sources and their blocker.

## Trace

`controllerSourceDiscovery.discover` → `discoverControllerPhpFiles` → directory read → `visitEntries` → existing upstream discovery judgment factory → `continueWith` → recursively visit remaining entries → source-document reads → semantic judgment pipeline → manifest builder judgment.

## Validation boundaries

Run `npm run audit:phase2902-no-promise-chaining` and the retained phase audits. This audit verifies source structure only; it does not claim full TypeScript typechecking, a complete build, full tests, or CLI end-to-end success.
