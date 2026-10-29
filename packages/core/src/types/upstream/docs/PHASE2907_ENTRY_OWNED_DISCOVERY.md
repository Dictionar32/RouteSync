# Phase2907 — Entry-Owned Discovery Operations

## Root-cause finding

Phase2906 removed conditional-expression ternaries from the traced CLI composition file, but it still selected local `entryActions` by a string key derived from filesystem booleans. That left entry disposition owned by the CLI composition rather than by an upstream domain contract. This phase moves the *post-classification disposition* into the existing upstream discovery contract module.

## Contract-first change

`laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` now exports `LaravelControllerSourceDiscoveryEntry`, its domain-specific `LaravelControllerSourceDiscoveryEntryOperations`, its handlers, and the interface-first `laravelControllerSourceDiscoveryEntryFactory`. Each classified entry carries `continueDiscovery`, which invokes the matching domain continuation. The CLI uses this operation instead of maintaining a local string-keyed action table. The existing discovery result ADT and its `includeSource`, `block`, and `continueWith` operations remain authoritative.

## Runtime trace

`Dirent` (OS adapter evidence) → `SourceFile` identity → upstream classified entry ADT → `continueDiscovery` → directory recursion / symbolic-link block / PHP source inclusion / ignored entry → discovery result ADT → document reading → semantic inventory closure → manifest builder judgment → terminal manifest ADT.

## Explicit remaining boundary

The adapter still interprets `Dirent.isDirectory()`, `isSymbolicLink()`, and `isFile()` to classify an operating-system entry. Those calls are the filesystem boundary, not domain continuation logic. The current implementation uses a small candidate lookup for this classification, so it does not claim to eliminate all boolean evidence or all primitive handling. The next root-cause target is typed filesystem failure evidence (`error.code` and root-vs-child context) and the remaining iterator cursor assertion.

## Constraints retained

- Runtime exports are interface-first where an exported operation is introduced.
- No `export function` declaration was introduced.
- No `Promise.then` or `reduce` traversal was introduced.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- No generic discovery result type was added.

## Verification scope

Run `npm run audit:phase2907-entry-owned-discovery` for structural assertions. This audit is not a substitute for full typecheck, build, unit tests, or CLI end-to-end execution.
