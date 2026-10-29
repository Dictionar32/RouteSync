# Phase 3125 Changelog

- Moved manifest success/rejection continuation ownership onto the upstream `ManifestBuilderJudgment` variants.
- Added `ManifestBuilderBlockedError`, preserving the original blocked judgment and blocker evidence.
- Removed the `if (judgment.kind === 'manifest_builder_complete')` branch from the CLI manifest adapter.
- Added CJS static test and report for this migration.
- Did not restore deleted relation foundation modules.
- Full TypeScript typecheck and end-to-end execution remain unverified because workspace dependencies are not installed.
