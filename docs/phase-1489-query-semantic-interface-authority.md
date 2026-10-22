# Phase 1489 — Query semantic interface authority

## Goal

Make the upstream query semantic interface own relation-path interpretation, grouping target classification, date-operation vocabulary, and ordering-direction resolution. This phase changes decision ownership; it is not a file relocation phase.

## Changes

- Added closed judgments to `QueryProducerSemanticInterface` for relation paths, grouping, date-part methods, date-relative methods, and ordering direction.
- Moved relation-path validation and construction into `queryProducerSemanticAlgebra`; scanner relation-path consumers now delegate to that authority.
- Moved grouping-target classification and grouping sequence construction into the algebra.
- Moved date-part and date-relative vocabulary tables out of `queryEvidenceProducer.ts`. Unknown date methods now resolve as `not_applicable`, rather than silently defaulting to `date` or `today`.
- Ordering direction now resolves to a judgment. Explicit unknown strings such as `sideways` produce `malformed`, instead of silently becoming ascending. Missing direction still resolves to ascending, preserving the intended Laravel default.
- Added tests for malformed relation paths, grouping, date vocabulary, and unknown ordering direction.

## Boundary still open

The scanner's existing operation projection still adapts some judgments to `RelationOption`, so diagnostic preservation is not yet end-to-end. `modelFromReceiver` and portions of query operation assembly also remain scanner-owned. They are explicit follow-up seams, not claimed as completed by this phase. A complete interface-first cutover must introduce a diagnostic-bearing producer result and migrate consumers before removing the legacy projection.

## Verification

- Phase 1489 static ownership audit: expected to pass when executed from the repository root.
- Phase 1131 broad audit: existing check remains failing because six upstream test files import compiler modules; production code imports were not established by that check.
- Full build/typecheck/test has not been established in this archived workspace: dependencies are absent and global TypeScript 5.8.3 reports existing repository-wide type errors. Do not treat static ownership audit as a substitute for the full test suite.
