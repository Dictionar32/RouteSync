# Phase 2563 — CLI Discovery Completeness Boundary

## Root cause

The controller source discovery operation treated a directory listing as complete while `Dirent` entries that were symbolic links matched neither `isDirectory()` nor `isFile()`. Those entries were silently omitted, so the upstream inventory authority could receive a source inventory that looked complete despite a traversal gap. A symbolic link at the controller root was also followed by `readdir` without a typed policy decision.

## Change

- Evolved the existing upstream `LaravelControllerSourceDiscoveryBlocker` ADT with `controller_source_discovery_symbolic_link_encountered`.
- Evolved the existing discovery result/interface contract version from 1 to 2 and made the symlink policy explicit.
- The CLI discovery implementation checks the directory root with `lstat` and blocks on symbolic-link entries instead of silently omitting or traversing them.
- The composition boundary preserves the exact blocked discovery judgment and does not create an inventory or manifest from partial traversal.
- Evolved the existing manifest composition reasoning contract to version 8 and recorded the new completeness obligation.

## Scope boundary

This closes the silent-omission case for a symbolic link at the controller root and for symbolic-link entries encountered during recursive enumeration. It does not claim a general canonical filesystem identity proof for every ancestor of the configured project root, nor does it resolve symbolic links. The conservative contract is to block rather than infer completeness.

## Validation

Run `npm run audit:phase2563-cli-discovery-completeness-boundary`. The audit checks the existing ADT, versioned contract, `lstat` boundary, nested symbolic-link handling, preservation of blocked discovery outcomes, and TypeScript syntax transpilation. Full package build, full typecheck, Vitest, and end-to-end CLI were not run as part of this phase.
