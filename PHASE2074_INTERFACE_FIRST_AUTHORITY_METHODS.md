# Phase 2074 — Interface-first authority methods

## Scope

Trace starts from the uploaded Phase 2073 snapshot and follows the existing invocation judgment through its integrated response, AST projection authority, and Laravel controller scanner. No `relation/foundation` subscanner is introduced.

## Changes

- Replaced `const` arrow helpers and the factory in `laravelControllerInvocationSemanticJudgmentAuthority.ts` with methods on `LaravelControllerInvocationSemanticJudgmentAuthority`.
- Removed the overridable reasoning parameter. The authority reads the canonical contract and reasoning rules from the existing upstream interface.
- Replaced the `const judgeAstProjection = (...) => ...` helper with a method on `LaravelControllerAstProjectionSemanticAuthority`.
- Changed the AST projection authority interface from a function-valued property to a method contract.
- Updated public exports to expose the class and the singleton authority, not the removed factory.
- Added `audit:phase2074-interface-first-authority-methods`.

## Trace result

`PHP AST evidence -> source binding authority -> integrated response authority -> invocation semantic judgment -> AST projection judgment -> Laravel controller scanner`.

The invocation judgment retains the four distinct integrated outcomes: not connected, source-binding rejected, complete, and blocked. AST projection forwards the exact judgment objects; it does not reconstruct response provenance.

## Explicit remaining work

The broad Laravel controller scanner still contains runtime orchestration written as `const` arrow functions, including `sequenceToArray`, `scanLaravelControllers`, and `createLaravelControllerScanner`. This phase does **not** claim those have been removed. They are the next interface-first migration target: promote scanner behavior to the existing scanner interface/class contract, then make the scanner executor consume closed upstream judgments without owning semantic classification. The existing scanner also imports relation sequence operations; this phase did not add or move any relation/foundation subscanner.

## Verification boundary

The Phase 2074 audit is a source-structure audit only. Full TypeScript typecheck, project build, and Vitest were not run in this environment.
