# Phase 1554 — Interface-first runtime executor contract hardening

## Scope

This phase continues from Phase 1553 in the actual `RouteSync` workspace. It does not claim that all semantic reasoning has been removed from `core/src/compiler/scanner`.

## Trace findings

- `packages/core/src/types/upstream/semanticTypeDerivationInterface.ts` defines the request, authority port, runtime executor port, closed judgment, and proof contract.
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationAuthority.ts` owns semantic derivation by composing the existing resource, route-response, and model derivation algebras.
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts` delegates to the authority and validates the closed judgment; it must not independently derive semantic types.
- `packages/core/src/compiler/scanner/subscanners/SemanticTypeDeriver.ts` is a compatibility facade that invokes the runtime executor.
- The wider scanner still contains the separate `RequestTypeDeriver` family under `subscanners/request-deriver/`, plus `lexer/astClassifierRuntime.ts` and `wiring/routeManifestTypeLowering.ts`. These remain explicit migration frontiers, not falsely declared complete.

## Model improvement

The executable boundary now validates an `unknown` candidate before reading nested proof fields. This reflects the fact that TypeScript interfaces are erased from emitted JavaScript. Malformed authority/plugin output is rejected with the same stable contract-violation error instead of leaking an incidental `TypeError` from `candidate.proof.sourceCoverage` or `candidate.proof.stages`.

The executor remains a delegate-and-validate boundary. It does not infer, classify, repair, or re-derive semantic types. The authority remains the semantic owner.

## Validation

- Phase 1552 interface-first audit: 10/10 passed.
- Phase 1550 whole-scanner inventory audit: passed; inventory accounts for 455 TS/TSX files and explicitly preserves unmigrated frontiers. Its zero-direct-solver-call result is not evidence that no semantic reasoning remains in scanner.
- Phase 1554 runtime contract-shape audit: run via `npm run audit:phase1554-runtime-contract-shape`.
- TypeScript build / Vitest: must be reported separately; static audit success is not a substitute for either.

## References

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic compiler analyses/transforms query behavior through interfaces instead of encoding concrete implementation knowledge.
- TypeScript Handbook, Basic Types: https://www.typescriptlang.org/docs/handbook/2/basic-types.html — TypeScript annotations are erased before JavaScript runtime execution; runtime boundaries need actual value validation.
