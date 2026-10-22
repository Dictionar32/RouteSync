# Phase 1696 — Laravel Subscanner Interface-First Contracts

## Scope

This phase defines the upstream contracts before changing scanner wiring. It intentionally does not rewrite, wrap, empty, or delete legacy subscanner implementations.

## Contracts introduced

- `LaravelRouteScannerInterface`
- `LaravelControllerScannerInterface`
- `LaravelModelScannerInterface`
- `LaravelFormRequestScannerInterface`
- `LaravelResourceScannerInterface`
- `LaravelChannelScannerInterface`

Each contract is exported from `types/upstream/index.ts` and the public core entry point. Inputs and outputs use typed upstream/source-model products rather than exposing scanner classes as the contract.

## Required migration order

1. Validate each contract against the semantic authority and evidence available for that domain.
2. Close any missing input/output knowledge in upstream ADTs and judgments before implementation wiring.
3. Implement adapters/wiring that satisfy the contracts.
4. Move pipeline consumers to these interfaces and test behavior against the Laravel ecommerce example.
5. Verify there are no direct consumers of legacy scanner implementations.
6. Empty obsolete files in place, then remove them in a separately audited phase.

## Explicit non-claims

- The six interfaces are contracts only; no legacy scanner is yet wired through them.
- Semantic reasoning has not been claimed to have moved out of the legacy scanner implementations.
- Build/typecheck is not verified in this environment: `tsdown` and local TypeScript ambient dependencies are unavailable, and the globally installed TypeScript compiler rejects the repository's configured target/lib options.

## Audit

Run `npm run audit:phase1696-laravel-subscanner-interface-first` to verify contract presence, closed markers, public exports, and that legacy files remain present pending the wiring cutover.
