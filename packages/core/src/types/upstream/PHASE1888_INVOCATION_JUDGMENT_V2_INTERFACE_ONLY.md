# Correction — Canonical Invocation Semantic Judgment (Phase 1891)

## Decision

The parallel `LaravelControllerInvocationSemanticJudgmentV2`, V2 source-subject, and V2 inventory contracts were removed. They duplicated the same Laravel invocation domain instead of improving the canonical interface.

## Canonical ownership

- `LaravelControllerInvocationSemanticJudgmentInterface` remains the one canonical outcome-indexed judgment.
- `judgment.sourceFile` remains the canonical controller source identity consumed by the existing inventory and scanner boundaries.
- `judgment.response` remains the exact integrated response union member; complete and blocked outcomes retain their closed source-binding provenance, rejected outcomes retain the identity conflict, and not-connected remains explicit.
- The canonical judgment contract is version 8 and explicitly prohibits a parallel judgment/inventory model for the same domain. The Laravel scanner boundary contract is version 58 and explicitly requires the scanner to preserve the exact nested integrated response and canonical source identity without introducing a parallel judgment model.
- The existing inventory contract continues to close the one-to-one relation between source inventory and canonical judgments.

## Scope boundary

This correction is interface-first. It does not change the runtime judgment authority, inventory authority, Laravel scanner implementation, or scanner wiring. No TypeScript build is claimed.
