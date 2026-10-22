# Phase 2099 — Interface-First Declaration Gate Before Runtime Executor

## Starting point

Based on Phase 2098 and the Phase 2097 static trace to CLI. This phase makes one implementation correction at the controller scanner choke point; it does not claim global retirement of `semantic/relations`, `semantic/foundation`, or `subscanners`.

## Interface-first contract change

`packages/core/src/types/upstream/laravelControllerScannerInterface.ts`

- Contract version advanced from 27 to 28.
- The `scan` contract explicitly states that declaration inventory closure is a publication/execution gate.
- A blocked declaration inventory is not a partial successful controller scan.

## Runtime correction

`packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`

Previously, declaration selection blockers were accumulated inside the same fold that could already invoke `scanControllerAction`, construct controller evidence, run integrated response judgment, and project the AST. The final result then discarded all artifacts if any blocker had been found. That protected publication but did not prevent semantic work from running before closure.

Now the scanner aggregates declaration blockers immediately after the upstream declaration authority returns its selections. If any declaration is blocked, it returns the closed `laravel_controller_scan_blocked` outcome with an empty controller tuple before entering the action/response/AST fold. If execution reaches the fold but encounters a blocked selection, it raises an invariant error because the pre-execution closure gate should have made that state unreachable.

This is a real control-flow correction aligned to the interface, not merely an added type declaration.

## Trace position

The full CLI trace remains:

`CLI scan -> PHP invocation pipeline -> invocation inventory receipt -> manifest builder -> source AST scanner -> Laravel source AST pipeline -> controller scanner -> complete source model -> dataflow judgments -> manifest projections / generators`.

The correction changes the controller scanner's internal ordering only. It does **not** sever all its legacy imports.

## Remaining legacy dependencies

The controller scanner still imports `semantic/relations` and `subscanners` helpers including `scanControllerAction`, `controllerProducer`, and controller AST canonicalization. The source AST pipeline, route scanner, resource scanner, other core consumers, and eight CLI parser consumers still need staged migration. The Phase 2097 static trace counts are a baseline, not updated zero-dependency proof.

No `semantic/foundation` deletion is justified by the existing zero-direct-import scan; re-export and non-TS references remain outside its proof.

## Audit and validation

- `scripts/audits/audit-phase2099-controller-declaration-gate-before-runtime-executor.cjs`: checks the gate precedes relation fold, action subscanner execution, integrated response judgment, and AST projection.
- `scripts/audits/audit-phase2098-controller-scan-closed-outcome-adt.cjs`: updated to canonical contract version 28.
- Static audits are not type checking and do not prove dynamic behavior.
- Build, TypeScript typecheck, and Vitest were not run in this environment.

## Next migration order

1. Define the canonical action-execution interface and closed output contract before wiring migration.
2. Replace `scanControllerAction` semantic ownership with an injected upstream judgment executor; preserve exact invocation, declaration, and response correlation.
3. Trace route/resource consumers and their producer helpers before retiring those subscanner modules.
4. Migrate the eight CLI relation-helper consumers before removing public relation exports.
5. Re-run the source-to-CLI import/call trace and only claim retirement when no production dependency remains.
