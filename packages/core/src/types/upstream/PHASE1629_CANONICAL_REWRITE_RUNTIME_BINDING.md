# Phase 1629 — Canonical rewrite runtime binding

## Error-guided finding

The same `SemanticRewriteAuthorityInterface` was repeatedly wrapped in new runtime-executor instances by scanner resource mapping, scanner rewrite compatibility code, the semantic behavior kernel, and the constraint runtime facade. The executor itself only delegates to the authority. Reconstructing it at each consumer added object-level indirection without adding semantic authority or a distinct contract.

## Contract decision

- `semanticRewriteAuthority` remains the single owner of rewrite and constraint reasoning.
- `SemanticRewriteRuntimeExecutorInterface` remains the runtime boundary.
- `semanticRewriteRuntimeExecutor` is the canonical production binding of that existing interface to the existing authority.
- Scanner and kernel consumers share that binding.
- `executeSemanticConstraintProgram` remains as a compatibility entry point but delegates to the canonical executor; it no longer constructs a nested executor.
- `createSemanticRewriteRuntimeExecutor` remains available for explicit dependency injection and tests. It is not used to instantiate production executors at each consumer.

## Non-goals

This phase does not merge domain-specific AST, request-type, data-flow, or controller-variable contracts into the rewrite executor. Those authorities carry different judgments and proof obligations. It also does not delete `semantic/foundation`, which still provides the generic relation algebra and solver implementation.

## Verification

Run `npm run audit:phase1629-canonical-rewrite-runtime-binding`. Full TypeScript build and Vitest remain separate verification requirements.
