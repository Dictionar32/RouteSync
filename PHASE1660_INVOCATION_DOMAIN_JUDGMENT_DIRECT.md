# Phase 1660 — Invocation Domain Judgment Direct

## Intent

Remove the invocation-specific relational DSL/compiler from the semantic reasoning path. Invocation meaning is now derived directly from canonical typed semantic knowledge. The invocation model and public contract remain the domain authority; the algebra computes domain judgments without compiling rule declarations into generic relation programs.

## Changes

- Replaced relation-program execution in `invocationSemanticJudgmentAlgebra.ts` with direct domain derivation over invocation facts, callable facts, callable-role data-flow evidence, positional parameters, and declared emissions.
- Candidate callables are deduplicated by semantic knowledge identity. A judgment closes only with invocation evidence, exactly one target, and no unresolved obligations.
- Ambiguous target candidates remain visible as partial evidence, but argument bindings and effects are not projected until the target is unique.
- Replaced relation-engine derivation proof with typed `InvocationSemanticDerivationWitnesses`; trace applications now reference domain witnesses.
- Updated authority checks to validate domain witness ownership, closure trace, derivation status, and single-target closure.
- Retired `invocationSemanticModelCompiler.ts` in place. It contains no lowering implementation.
- Preserved executor delegation and scanner wiring.
- Bumped invocation model version to 6 and public contract version to 16.

## Verification

- Focused strict TypeScript check for the invocation interface, algebra, authority, executor, and scanner facade: passed with the available TypeScript 5.8.3 compiler.
- Phase 1660 static architecture audit: see `scripts/audits/audit-phase1660-invocation-domain-judgment-direct.cjs`.
- Full build and Vitest runtime suite were not run: this extracted workspace has no `node_modules`, and `tsdown`/Vitest are unavailable.

## Architecture boundary

The direct domain algebra still contains the executable implementation of invocation semantics, but it no longer compiles invocation rules into a generic relation engine. The authority validates its judgment; the executor delegates; the scanner only wires inputs and outputs.
