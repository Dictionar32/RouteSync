# Phase 1620 — Interface-First AST Semantic Domain Contract

## Scope

This phase continues the agreed order: mature `packages/core/src/types/upstream/astSemanticInterface.ts` first. It does not migrate scanner wiring, semantic algebra, `requestTypeDerivationInterface.ts`, or runtime executors.

## Trace

- `astSemanticInterface.ts` owns `AstSemanticClosureRequest`, the closed/incomplete closure result, the fixed-point certificate, and the current closure evaluator.
- Scanner consumers located during trace include:
  - `packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts`
  - `packages/core/src/compiler/scanner/subscanners/resource/resourceSemanticMappingRelations.ts`
  - `packages/core/src/compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts`
  The scanned imports use AST semantic terms; they do not currently call the closure request API directly.
- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` defines separate inference, authority assessment, proof verification, semantic pipeline, and decision contracts. It remains the next contract frontier after the AST closure boundary is made type-safe.
- The request-type runtime executor previously traced consumes `RequestTypeDerivationSemanticPipelineInterface`; this phase deliberately does not change it.

## Contract change

The closure API no longer uses interchangeable primitive fields for identity or round accounting:

- request identity is `AstSemanticRequestIdentity`;
- seed snapshot, rule set, fact set, and derivation ledger use separate identity value objects;
- round limit and completed round count use separate numeric value objects.

Each identity class has a distinct discriminant, preventing accidental assignment between semantically different identities under TypeScript's structural type checking. Canonical serialization remains a `StringValue` payload, not a cryptographic digest and not proof of authenticity. Round-limit validation remains in the authority so invalid input can be represented as a typed `incomplete` result rather than being silently coerced.

The closure certificate continues to correlate the same request, seed snapshot, rule set, resulting fact set, and derivation ledger as the closure result. The existing `AstSemanticInterface` now also exposes `verifyClosure(request, closure)`, which rebinds those identities, checks the round bound and seed preservation, and checks that recorded rules, premises, and conclusions agree structurally with the request and result. This verifier is explicitly structural: it is not a cryptographic authenticity check and does not prove that arbitrary rule implementations are semantically sound. The closure algorithm and scanner wiring are unchanged.

## Validation limits

- The structural Phase 1620 audit checks the public domain contract, its discriminants, and the existing-interface closure verification contract.
- A focused `tsc` invocation traverses a broad dependency graph and reports pre-existing errors in unrelated resource-model, query-producer, route-security, and semantic-dataflow files. No diagnostic from that run points to `astSemanticInterface.ts` or its closure proof fixture; this is not a claim that the full project typechecks.
- The targeted Vitest invocation did not complete within the available execution window. Do not claim that the test suite passed.
- Full build was not run/verified.

## External references

- [MLIR Interfaces](https://mlir.llvm.org/docs/Interfaces/) supports defining generic compiler behavior through explicit interfaces rather than embedding operation-specific semantics into every consumer.
- [TypeScript Handbook: Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) supports explicit closed outcome variants and exhaustive handling; it does not itself prove semantic correctness.

## Next contract frontier

After this AST closure contract is reviewed, audit `requestTypeDerivationInterface.ts` against it: source-input binding, inference packet identity, authority candidate/proof correlation, verification binding, and pipeline closed-result semantics. Only after both interfaces are mutually consistent should algebra, wiring, scanner behavior, or runtime executor implementation be migrated.

## Cross-boundary trace observations

- The scanner files listed above currently import `AstSemanticTerm` and/or `astSemanticTextTerm`; a repository search did not find a direct call to `astSemanticInterface.close` from `core/src/compiler/scanner`. Therefore, the AST closure contract is not yet proven to be the scanner's active closure authority. Do not claim end-to-end wiring until a later, explicitly authorized wiring phase connects the intended consumer.
- `routeManifestTypeLoweringAuthority.ts` and `routeManifestProjectionAuthority.ts` consume `RequestTypeDerivationSemanticPipelineInterface`; `requestTypeDerivationRuntimeExecutor.ts` also consumes that pipeline. This is a distinct pipeline boundary, not a direct call into `AstSemanticInterface`.
- `RequestTypeDerivationSemanticAuthorityAssessmentFor` keeps the authority proof as the assessment's decision. `RequestTypeDerivationSemanticReasoningInterface`, `RequestTypeDerivationProofVerificationInterface`, `RequestTypeDerivationSemanticDecisionInterface`, and `RequestTypeDerivationSemanticPipelineInterface` separate inference, verification, decision construction, and consumer-facing orchestration. The executor still contains runtime envelope/input integrity checks; it has not been changed in this phase.

## Recommendation after Phase 1620

1. Review this AST closure contract and its structural verifier before expanding it. The verifier is a correlation/ledger consistency check, not a proof that rule implementations are semantically sound.
2. Audit `requestTypeDerivationInterface.ts` independently for source-input identity, inference packet binding, authority proof binding, verifier-result binding, and whether a `closed` outcome is sufficiently constrained by its proof.
3. Reconcile the two contract families only where the actual type/dependency graph establishes a relationship. Do not invent a dependency or wire AST closure into request-type derivation just because both are semantic interfaces.
4. Only after both audits are accepted should a separate phase change algebra or wiring, and only later simplify runtime executor checks that are genuinely redundant with verified contracts.
