# Phase 1659 — Invocation Domain Model

## Change

`InvocationSemanticJudgmentInterface` no longer authors invocation semantics as a relational rule program. The interface declares a closed catalog of invocation-domain operations: evidence presence, target resolution, target cardinality, positional argument binding, unmatched argument obligations, effect projection, and target completeness.

The model no longer imports or exposes generic `premises`, `conclusions`, variables, literals, or relation-pattern builders. `invocationSemanticModelCompiler.ts` is a dedicated lowering adapter from those domain operations to the relation engine's execution protocol. It is not a generic law-kind registry. The algebra delegates model lowering to this adapter; the authority/executor/scanner boundary remains unchanged.

The semantic model version is 5 and the public contract version is 15.

## Verification

- `scripts/audits/audit-phase1659-invocation-domain-model-no-relational-dsl.cjs`: 10/10 checks pass.
- Focused strict TypeScript check on the modified interface, model compiler, and invocation algebra passes with the available global TypeScript compiler 5.8.3.
- Full repository build and runtime test suite were not run: workspace dependencies are not installed in this extracted archive.

## Boundary note

The relation engine still receives a low-level execution representation after lowering. The architectural change is that the public invocation semantic model no longer encodes its meaning as that representation; the dedicated compiler is a lowering adapter. This phase does not claim to remove the repository's relation engine or all low-level execution machinery.
