# Phase 2360 — Route scanner authority injection

## Root cause

The scanner advertised authority operations on `LaravelRouteScannerInterface`, but its `scan` operation reached back into the exported `laravelRouteScanner` singleton to obtain those same operations. That made the contract look injectable while coupling execution to the singleton.

## Change

`createLaravelRouteScanner` now accepts a `Pick` of the authority fields from the existing `LaravelRouteScannerInterface` and captures those exact operations in the executor closure. The factory returns the existing interface; no duplicate authority interface was introduced. The CLI pipeline still receives the default scanner through its existing dependency contract.

## Scope and unresolved blockers

This phase repairs authority injection only. It does **not** complete the broader forbidden-dependency migration: `laravelRouteScanner.ts` still imports `semantic/relations` and several `subscanners`, and the route producer relation module also imports semantic relation primitives. The active source-AST pipeline still composes additional subscanner implementations. These are recorded as outstanding architectural work, not reported as solved.

## Verification

Run `node scripts/audits/audit-phase2360-route-scanner-authority-injection.cjs` and the Phase 2350–2359 audit suite. TypeScript typecheck, Vitest, build, and CLI end-to-end are not claimed unless separately run in an environment with dependencies installed.
