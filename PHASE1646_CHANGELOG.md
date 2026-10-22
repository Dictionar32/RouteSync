# Phase 1646 — Declarative Derivation Engine and Proof-Bound Rule Applications

## Architectural change

The invocation target-resolution rule is now fully declared in the upstream semantic contract as a premise/conclusion derivation program. A generic compiler lowers this structure into the relation engine protocol; the invocation algebra no longer handwrites the target-resolution rewrite pattern.

## Contract change

`InvocationSemanticContract` advances to version 6. The proof binding now explicitly includes `rule-application-premises-and-bindings`, and each rule-trace entry carries concrete relation-engine derivation witnesses. For target resolution these witnesses include the matched premises, variable bindings, and derived call-target fact.

## Correctness repairs

- The batch path now creates per-invocation traces with the correct subject identity and rewrite proof.
- Aggregate proofs retain the traces of their actual per-invocation judgments rather than calling a per-invocation trace constructor with aggregate arrays.
- The regression test checks that two distinct target candidates yield two concrete derivation applications and that each application retains premises and bindings.
- Historical cumulative audits were updated to recognize the current contract version.

## Boundaries

- The runtime executor remains a pure authority delegate.
- Scanner code does not compile semantic rules, execute rewrite programs, or build traces.
- The generic derivation compiler is a shared mechanism, not a complete migration of every invocation policy. Argument binding, emission projection, ambiguity obligations, and closure policy remain domain algebra paths and are candidates for subsequent declarative migration.

## Verification

Static audit scripts are run separately and report their exact results in the Phase 1646 delivery message. A full TypeScript build remains unverified when the workspace does not contain the project's `tsdown` toolchain.
