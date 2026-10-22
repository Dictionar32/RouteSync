# Phase 1848 — Resource Fixed-Point Cycle Contract

## Trace

Phase 1847 closed resource/model relation propagation as a whole-batch fixed point. Its non-convergence path downgraded every resource to unresolved, even when only a subset of resource judgments oscillated. The fixed-point comparison also serialized outcomes to strings, hiding the semantic ADT behind a primitive representation.

## Interface-first change

- Added `ResourceModelBindingClosureResolution`, a discriminated union distinguishing `stable_fixed_point` from `cycle_conservative`.
- The cycle receipt now lists only `affectedResources`; stable resources remain represented by their actual judgments.
- Advanced the semantic judgment and resource scanner contracts to version 7.
- Exported the closure-resolution contract from the public core barrel.

## Authority change

- Replaced JSON serialization identity with structural comparison over `resolved`, `unresolved`, and `ambiguous` outcomes.
- Cycle detection compares each subject across the repeated cycle states.
- Only subjects whose semantic outcome changes across the cycle receive conservative `unresolved` judgments; other subjects retain the latest closed judgment.
- Stable convergence produces an explicit `stable_fixed_point` receipt.
- Candidate cardinality is checked before indexed candidate comparison, avoiding out-of-range access when candidate sets differ.

## Runtime boundary

`laravelResourceScanner` remains an executor/projection layer: it collects source evidence, calls the existing `judgeBatch` authority once, then projects resolved judgments into resource ASTs. The complete `LaravelControllerScanJudgment`, including integrated invocation semantic judgment, continues across the interface boundary. No `semantic/foundation` dependency was introduced.

## Verification

Static audits for Phases 1836–1848 passed: 160/160 checks. `package.json` parses, the new audit is registered, and ZIP integrity is verified. Build, typecheck, and E2E were not run, per the established workflow constraint.
