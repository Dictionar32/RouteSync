# Phase 1553 — Interface-first runtime executor and closed-proof contract

## Trace result

The Phase 1552 semantic object type path already moved derivation out of the scanner, but its runtime contract was weaker than its name implied: the authority returned `closed: true` plus source counts, while the executor simply forwarded the value. A TypeScript interface alone cannot enforce runtime invariants because its type information is erased during compilation. The runtime boundary therefore needs a narrow executable contract check, not another semantic solver.

## Change

- `types/upstream/semanticTypeDerivationInterface.ts` now defines a proof record with an ordered stage tuple (`resource → route_response → model`), input source coverage, result count, and a completion marker.
- The same upstream contract exports `assertSemanticTypeDerivationJudgment`, which verifies closure markers, authority/derivation identity, coverage conservation, proof stage order, and result-count consistency. It does not infer types or select candidates.
- `semanticTypeDerivationAuthority` emits the proof alongside the judgment, using the existing derivation algebras.
- `semanticTypeDerivationRuntimeExecutor` delegates to the authority and enforces the returned contract.
- Concrete authority selection is moved to `semanticTypeDerivationRuntime.ts`; `SemanticTypeDeriver` scanner wiring consumes the already-composed executor instead of importing/constructing the authority itself.
- The runtime executor test covers both delegation and rejection of inconsistent source coverage.

## Architectural boundary

`Source AST/evidence → SemanticTypeDerivationRequest → semanticTypeDerivationAuthority → closed judgment + proof → runtime executor contract check → scanner wiring/consumer`

The executor checks the authority's declared contract; it does not perform semantic reasoning. The proof is an executable consistency certificate for this derivation boundary, not a claim of a machine-checked formal proof of every inferred field.

## Remaining scanner frontiers (not claimed solved)

1. `subscanners/RequestTypeDeriver.ts` and `subscanners/request-deriver/*`: request-type derivation remains under scanner and mixes semantic derivation with descriptor assembly.
2. `lexer/astClassifierRuntime.ts`: AST construction is legitimate scanner work, but domain-level inference/classification needs a rule-by-rule ownership trace.
3. `wiring/routeManifestTypeLowering.ts`: still directly calls `RequestTypeDeriver`.
4. Route security/CRUD and controller expression/dataflow consumers: authority existence does not prove every consumer has migrated to its closed judgment.

These are explicitly retained as open work rather than hidden behind a broad “scanner fixed” claim.
