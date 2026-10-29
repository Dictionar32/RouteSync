# Phase2906 — No Ternary in the CLI Manifest Composition Path

## Scope

This phase follows the existing upstream discovery ADT into `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`. It removes conditional-expression ternaries from the traced composition module rather than changing them into `if`/`switch` statements.

## Changes

- Filesystem failure translation now uses named blocker factories keyed by the filesystem error code and root/directory role.
- Directory-entry behavior is represented by named actions (`directory`, `symbolicLink`, `phpSource`, `ignored`) selected from the adapter's `Dirent` observation.
- Cursor completion and directory-read result selection use explicit operation tables instead of ternary expressions.
- PHP source read failures use named blocker operations.
- Existing upstream discovery result operations (`continueWith`, `includeSource`, `block`) remain the authority for domain transitions.
- The runtime traversal continues to avoid `Promise.then`, `reduce`, mutable `let` accumulators, and exported function declarations in the traced modules.

## Boundary that remains

The Node filesystem adapter still needs to observe OS facts (`lstat`, `Dirent` predicates) and catch rejected filesystem operations. Those are environment-boundary responsibilities; this phase does not claim the entire repository is free of all conditionals or that the adapter has become a zero-branch runtime. In particular, the symbolic-link check at `lstat` remains a conventional branch and is a candidate for a later explicit filesystem-observation contract. This is called out rather than hidden behind a helper.

## Validation scope

Run `npm run audit:phase2906-no-runtime-ternary` and the earlier Phase2905 audit. This audit is structural; it is not a substitute for full project typecheck, build, test suite, or CLI end-to-end verification.
