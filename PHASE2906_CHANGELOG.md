# Phase2906 — Fully Typed Runtime Scanner Operations

## Objective
Remove conditional-expression ternaries from the traced CLI manifest composition path and stop discriminating a raw `Dirent[] | LaravelControllerSourceDiscoveryResult` union with `Array.isArray` and a cast.

## Root-cause direction
The upstream discovery ADT remains the owner of domain transitions (`continueWith`, `includeSource`, `block`). The Node adapter's directory-read outcome now has a specific typed settlement with its own `continueWith` operation, so the composition does not reinterpret the raw directory-read union.

## Changes
- Replaced nested filesystem-error ternaries with named blocker factories.
- Added a concrete directory-read settlement ADT with `entries` and `blocked` variants and an executable continuation.
- Replaced the `Array.isArray` result split and union cast with `directoryReadSettlement.continueWith(...)`.
- Replaced nested `Dirent` ternaries with named entry actions and explicit action selection.
- Replaced source-read error ternaries with named blocker operations.
- Kept interface-first runtime exports and the empty `packages/core/src/types/upstream/collections.ts`.

## Remaining limitation
The OS boundary still performs filesystem I/O and catches rejected operations. This phase does not claim repository-wide elimination of all conditional logic, nor does it claim full project typecheck/build/test/CLI E2E success. The audit is structural and focused on the traced composition file plus the existing upstream discovery factory.

## Validation
The Phase2895, 2897, 2898, 2899, 2900, 2901, 2902, 2903, 2905, and 2906 structural audits were run. The two changed TypeScript modules were checked with `transpileModule` for syntax diagnostics. ZIP integrity was checked after packaging.
