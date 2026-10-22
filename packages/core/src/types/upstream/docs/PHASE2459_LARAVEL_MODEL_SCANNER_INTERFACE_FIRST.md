# Phase 2459 — Laravel Model Scanner Interface-First Migration

The existing `LaravelModelScannerInterface` remains the authoritative scanner contract. The implementation is now owned by `compiler/scanner/laravelModelScanner.ts` and exported as the typed `laravelModelScanner` operation; the pipeline composition injects that value directly. The legacy `subscanners/ModelScanner.ts` entrypoint and barrel export were removed. Shared filesystem/source acquisition is owned by `compiler/scanner/sourceFiles.ts`, without `semantic/relations` or `semantic/foundation` imports.

This phase closes only the entrypoint and source-acquisition ownership boundary. The parser and producer helpers under `subscanners/model` remain active and 13 of those files still directly import `semantic/relations`. Their semantic operators must be traced and migrated individually; this document does not claim complete model-subscanner retirement or transitive relation removal.

Validation: Phase2459 audit 11/11, Phase2458 audit 7/7, Phase2457 audit 6/6, Phase2456 audit 7/7, Phase2454 audit 11/11, Phase2453 audit 9/9, Phase2452 scoped audit 7/7 with 3 debts open, and TypeScript syntax transpilation 15/15. Full typecheck, Vitest, package build, and CLI integration were not run because local `node_modules` is absent.
