# Phase 1572 — Interface-first domain-correlated counterexamples

## Scope

This phase changes the upstream semantic contract only. It does not implement the authority, migrate scanner wiring, or change the runtime executor. Those are deliberately later steps in the requested order: contract → authority → wiring → executor.

## Trace

1. `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
   - Owns `RequestTypeDerivationLawId`, source evidence references, occurrence identities/locations, derivation judgments, verification failures, and `RequestTypeDerivationAuthorityInterface`.
   - Before this phase, both `duplicate_occurrences_are_distinct_source_locations` and `all_duplicate_occurrence_locations_are_pairwise_distinct` could report a broad `RequestTypeEvidenceReference` and broad `RequestTypeEvidenceKey` alongside an independent domain tag. That type shape admitted structurally mismatched counterexamples (for example, a `routes` domain label paired with request evidence).
   - This phase introduces `RequestTypeDuplicateOccurrenceLocationFailureEvidence` and `RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence`. Their discriminated variants correlate domain, semantic-key namespace, evidence-reference type, and occurrence-key namespace.

2. `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts`
   - Still exposes `derive(...): readonly RequestType[]`.
   - It creates a local `DerivationContext` and calls `aggregateRequestTypeGroups`; it does not call the declared upstream `RequestTypeDerivationAuthorityInterface`.

3. `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts`
   - Still performs request lookup, normalized lookup, resource grouping, action merging, and response selection locally.
   - The current implementation uses a `relationFirstOption` lookup and `requestValue` lookup path, and contains local casts/branching. These are still semantic policy surfaces, not merely mechanical projection.

4. `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts`
   - This is a separate semantic-type derivation executor. It receives a `SemanticTypeDerivationAuthorityInterface` and calls `assertSemanticTypeDerivationJudgment(request, authority.resolve(request))`.
   - It is not the RequestType derivation authority and was not changed in this phase.

5. Authority implementation search
   - A source search found the `RequestTypeDerivationAuthorityInterface` declaration in upstream types, but no implementation or caller of that interface under `packages/core/src`. Therefore this phase must not be described as a working authority migration.

## Semantic model change

The failure witness is now domain-correlated at the type boundary:

- `routes` → `RequestTypeRouteEvidenceKey`, `RequestTypeRouteEvidenceReference`, `RequestTypeRouteOccurrenceKey`;
- `resources` → `RequestTypeResourceEvidenceKey`, `RequestTypeResourceEvidenceReference`, `RequestTypeResourceOccurrenceKey`;
- `requests` → `RequestTypeRequestEvidenceKey`, `RequestTypeRequestEvidenceReference`, `RequestTypeRequestOccurrenceKey`.

The pairwise witness keeps `repeatedPairs` non-empty. This narrows the set of representable invalid states before verifier implementation. It does **not** prove that source locations are actually unique, that the keys are correctly derived from source coordinates, or that any authority currently emits these witnesses. Those are semantic obligations for the future verifier.

## Verification

- Phase 1572 structural contract audit: 11/11 checks passed.
- Targeted TypeScript check of `requestTypeDerivationInterface.ts`: 0 diagnostics reported directly in that file; command exits with code 2 due to 35 diagnostics in imported dependency modules, primarily `packages/core/src/types/domain/resourceModelMethodResolverOperation.ts` and related types.
- Full build and Vitest: not run; workspace has no root or core `node_modules`.
- Byte-for-byte unchanged from Phase 1571: `RequestTypeDeriver.ts`, `groupAggregator.ts`, and `semanticTypeDerivationRuntimeExecutor.ts`.

## Next architectural gate

Before touching the runtime executor, implement the authority and verifier behind this interface, prove each law against source evidence, and make the scanner consume its closed judgment. Only after scanner projection is mechanically downstream should executor changes be considered. In particular, a static string-pattern audit is not a substitute for executable semantic-law tests.
