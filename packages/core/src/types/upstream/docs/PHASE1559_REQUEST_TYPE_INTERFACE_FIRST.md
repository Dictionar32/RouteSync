# Phase 1559 — RequestType Semantic Authority Interface First

## Goal

Upgrade the semantic model in `types/upstream` before changing any runtime executor. This phase intentionally changes no scanner implementation or runtime execution path.

## Trace findings

- `compiler/scanner/subscanners/RequestTypeDeriver.ts` constructs a derivation context and calls `aggregateRequestTypeGroups`; it is currently an orchestration entry point for semantic derivation.
- `compiler/scanner/subscanners/request-deriver/groupAggregator.ts` owns decisions about explicit no-request routes, request lookup, case-insensitive resource grouping, action contribution replacement, response contribution precedence, and silent omission when request evidence is not found.
- `compiler/scanner/wiring/routeManifestTypeLowering.ts` directly invokes `RequestTypeDeriver.derive`, so the existing wiring is coupled to scanner-owned derivation.
- The existing group aggregation behavior does not expose a closed judgment for incomplete evidence or ambiguous request identity. In particular, missing request evidence is skipped instead of being represented as an explicit unresolved result.

## Interface model added

`requestTypeDerivationInterface.ts` defines:

- Typed input evidence for `RouteSemanticFlow`, `ResourceAst`, and `RequestAst`.
- An explicit algebraic domain policy for request lookup, resource grouping, action reconciliation, response reconciliation, and closure behavior.
- A canonical declarative contract with derivation rule order and precedence relations.
- A source-evidence inventory and per-route receipts.
- A closed judgment ADT: `derived`, `incomplete`, `conflict`, or `invalid_input`.
- Proof verification outcomes for source inventory, route coverage, policy, rule order, and closure.
- An authority interface with `derive` and `verify` operations.

## Important scope boundary

This is the interface/model phase. No runtime executor, scanner derivation implementation, or wiring has been changed to use the new contract yet. That is intentional: interface first, runtime last. The next phase should implement the authority against this contract and test its laws; only after that should scanner wiring be migrated, and the old runtime path retired last.

The contract's reconciliation policy makes existing behavior explicit as a proposed canonical policy. It does not claim the old scanner implementation already proves every policy or handles every conflict correctly.

## External design basis

MLIR's official interface documentation describes interfaces as a generic interaction layer that lets compiler transformations and analyses avoid embedding knowledge of each concrete operation or dialect: https://mlir.llvm.org/docs/Interfaces/.

TypeScript's official documentation explains that type annotations are erased and do not change runtime behavior: https://www.typescriptlang.org/docs/handbook/2/basic-types.html. Therefore this type contract defines static semantics, while a later implementation phase must add runtime checks for untrusted or dynamically produced values.
