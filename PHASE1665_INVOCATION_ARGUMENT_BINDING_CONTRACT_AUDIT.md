# Phase 1665 — Invocation Argument-Binding Contract Audit

## Decision

**Do not migrate the algebra, authority, executor, or scanner to the Phase 1664 argument-binding judgment yet.** The interface has useful explicit outcomes, but it does not currently encode enough evidence and invariants to serve as a trustworthy closed semantic contract. This phase is an audit only: it deliberately leaves the Phase 1664 interface and all runtime wiring untouched.

## Findings

### 1. The source model does not identify argument form

`SemanticInvocation` carries `arguments: readonly KnowledgeId[]`, while the new contract unconditionally declares `invocation-argument-index-to-callable-parameter-index`. The current algebra uses `resolved.parameters[argumentIndex]`. The interface cannot establish from its own input whether an invocation is positional-only or contains named arguments, unpacking/spread, or another argument form. Unless the upstream source model guarantees and documents positional-only normalization, this is an unsupported semantic assumption.

### 2. The union does not enforce its advertised outcomes

`established` can structurally carry an empty or partial `bindings` list. `incomplete` can carry no obligations. `not-required` does not encode that the invocation has zero arguments. The model states `everyArgumentBound: 'established'`, but the variant itself does not prove that every argument is bound. These are prose/policy constraints, not closed type-level judgments.

### 3. `blocked` permits contradictory target states

`targetResolution` and `candidates` are independent fields. The shape permits `unresolved` with candidates and `ambiguous` with zero or one candidate. A discriminated union should correlate unresolved with no candidate and ambiguous with multiple distinct candidates, or carry a separately validated target-resolution judgment.

### 4. Evidence is not correlated to the claim it supports

Each outcome carries `evidence: readonly SemanticSource[]`, but the contract does not identify which source proves each argument, parameter, correspondence, or unresolved obligation. A generic source list cannot by itself establish binding provenance. The existing algebra's `argument-binding-sources` projection currently uses callable declaration sources, not a binding-specific source relation.

### 5. Identity consistency is not represented

The judgment repeats `invocation` and `target`, but the type does not enforce `target.invocation` identity equals the top-level invocation. The same issue applies to each binding's invocation/callable matching the enclosing judgment. Authority checks may validate these, but that would mean the type contract is not yet closed on its own.

### 6. The rest of the pipeline still produces the old shape

The algebra still returns `argumentParameters: slice.bindings`; the authority and compatibility consumers still expect the previous aggregate representation. That is expected for an interface-first phase, but it means migration cannot be claimed complete or safe merely by changing names to `argumentBinding`.

## Required contract decisions before migration

1. Confirm whether upstream invocation knowledge is strictly positional. If not, add a typed argument-form model and explicit semantics for named/unpacked arguments before binding rules are finalized.
2. Define binding judgment variants with correlated invariants: no arguments, fully established bindings, partial bindings plus matching obligations, and target blocked with cardinality-consistent candidates.
3. Bind provenance to the specific argument/parameter correspondence and unresolved claim, rather than attaching an undifferentiated source array.
4. Define one identity owner for invocation and target, and make the enclosing judgment's consistency rules explicit in the contract.
5. Specify which invariants are guaranteed by construction in the upstream algebra and which must be validated at the authority boundary. The executor/scanner must not reconstruct them.
6. Only then migrate algebra → authority validation → executor → scanner/downstream consumers in that order.

## Scope and verification

- Changed: this audit report and its executable audit script only.
- Unchanged: `invocationSemanticJudgmentInterface.ts`, algebra, authority, runtime executor, scanner, and downstream consumers.
- The audit script confirms the design gaps against the actual source; it is not a type-check or full build.
- No full repository build is claimed in this phase.
