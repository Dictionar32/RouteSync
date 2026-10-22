# Phase 1667 — Invocation Argument-Binding Migration Readiness Audit

## Verdict

**Not ready for producer/algebra → authority → executor → scanner migration.** The current tree has a contract/implementation split, not merely a missing consumer rename. Keep the Phase 1666 contract changes staged; do not claim the new argument-binding judgment is active end-to-end.

## Findings confirmed from source

1. **The new judgment contract is not implemented by the algebra.** `InvocationSemanticJudgment` requires `argumentBinding`, and aggregate `InvocationSemanticAnalysis` requires `argumentBindings`; `invocationSemanticJudgmentAlgebra.ts` still returns `argumentParameters` for single and aggregate results. This is a direct producer/contract mismatch.
2. **Argument binding is inferred from array position without the evidence the contract requires.** `deriveEvidenceSlice` uses `invocation.arguments.flatMap((argument, argumentIndex) => resolved.parameters[argumentIndex])`. The `SemanticInvocation` model only exposes `arguments: readonly KnowledgeId[]`; there is no upstream positional-normalization evidence field or typed relation in this source model. Phase 1666's `InvocationPositionalArgumentEvidence` is declared but not derived from canonical upstream knowledge.
3. **A test consumer still asserts the old correspondence meaning.** The canonical interface now declares `normalized-positional-argument-to-parameter-order`, but the Phase 219 test still expects `invocation-argument-index-to-callable-parameter-index`. That stale assertion will fail after the semantic contract is migrated unless the test is deliberately updated.
4. **Per-binding provenance is not generated.** The algebra creates `SemanticArgumentParameterFlow` relations only. It does not construct `InvocationArgumentBindingClaim`, `InvocationArgumentCorrespondenceEvidence`, or `InvocationUnboundArgument`, and it does not establish argument-specific, parameter-specific, and correspondence-specific source evidence.
5. **Proof witnesses remain in the old shape.** `witnessesForSlice` emits an `argument-binding` witness with `invocation`, `bindings`, and `evidence`, while the new witness contract carries an `InvocationArgumentBindingJudgment`. Authority still validates legacy proof/trace invariants and does not validate binding identity, coverage partition, or claim-specific provenance.
6. **The aggregate API and test consumers are still on the old shape.** The algebra aggregates `judgment.argumentParameters`; `parameterFlowsForInvocation` reads `analysis.argumentParameters`; Phase 219 tests assert `analysis.argumentParameters`. These consumers need a deliberate compatibility/projection decision rather than a mechanical rename.
7. **The runtime executor itself is already thin.** It delegates `execute` to the authority and `executeAll` to the batch authority. It should remain unchanged unless the interface signatures force a wiring update.
8. **The scanner's invocation path is delegation-oriented.** `controllerDataflowAnalyzer.ts` calls `invocationSemanticRuntimeExecutor.executeAll(semanticKnowledgeDataFlow)` and passes the analysis onward. No argument-binding-specific classification is visible in that invocation call path. The main blocker is upstream model/algebra/authority and downstream type consumers, not a need to add scanner reasoning.
9. **Full build is unverified in this environment.** `packages/core/package.json` declares `tsdown`, but no local `node_modules/.bin/tsc` or `tsdown` executable was found in the extracted workspace. No full build result is claimed.

## Migration gate

Do not start broad migration until these gates are resolved:

- Upstream source model has typed, provenance-backed evidence for argument form (or explicitly represents form as unknown); do not manufacture `InvocationPositionalArgumentEvidence` from list order.
- One canonical meaning definition is selected; remove the stale conflicting correspondence literal.
- Algebra emits a complete `InvocationArgumentBindingJudgment` with a domain-valid outcome, identity-consistent target, bound/unbound partition, and per-claim evidence.
- Derivation witness and rule trace refer to that same judgment, rather than rebuilding an old binding list.
- Authority validates judgment invariants against the request and canonical knowledge, including identity, coverage, candidate cardinality, and obligation ownership.
- Aggregate and compatibility consumers intentionally project from `argumentBindings`; no hidden parallel `argumentParameters` source of truth remains. If compatibility is required, make it a named projection from the canonical judgment.
- Focused tests cover empty calls, confirmed positional binding, too-few parameters, target unresolved, target ambiguous, unproven argument form, identity mismatch, duplicate/missing coverage, and provenance gaps.
- Run focused tests and the actual package build once dependencies are available.

## Recommended next implementation order

1. Resolve the upstream evidence gap first; if upstream cannot prove positional normalization, model `argument-form-unproven` as the honest outcome instead of producing bindings.
2. Align the single semantic meaning catalog and judgment/witness contracts.
3. Migrate algebra to produce the judgment directly from typed evidence.
4. Strengthen authority validation against the judgment's invariants.
5. Update aggregate/compatibility projections and tests.
6. Verify executor and scanner remain delegators, then run full tests/build.

## Scope of this phase

Audit/report only. No production source files were modified. This avoids masking a readiness failure by mechanically rewriting consumers before the source evidence exists.
