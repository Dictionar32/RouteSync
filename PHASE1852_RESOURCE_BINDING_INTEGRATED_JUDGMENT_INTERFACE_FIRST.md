# Phase 1852 — Resource Binding Integrated Judgment Interface-First

## Scope

This phase strengthens the upstream semantic model before changing scanner wiring. It does not claim that the resource-binding runtime has become a pure executor yet.

## Trace findings

- `packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts` already declared candidate derivation rules, but precedence was duplicated as a rule-set field and the contract did not explicitly state the complete judgment semantics.
- `packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts` still owns candidate materialization, resolved/ambiguous/unresolved outcome construction, structural equality, fixed-point iteration, and conservative cycle handling. These are remaining semantic decisions, not merely AST projection.
- `packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts` passes the complete `controllerScan` judgment to `judgeBatch`; it projects the closed judgments after batch closure. It must not reconstruct invocation results from detached controller action lists.
- The source pipeline preserves the authority-closed invocation inventory receipt. The integrated invocation response remains a typed discriminated union.
- `resourceProducer` is still a downstream projection/producer dependency; this phase does not delete or empty it without a complete consumer trace.

## Interface-first improvement

Added `ResourceModelBindingSemanticJudgmentModelInterface` and the canonical `RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL` in the upstream owner. The contract now explicitly describes precedence, candidate selection, evidence provenance, ambiguity preservation, unresolved evidence, whole-batch least-fixed-point closure, conservative cycle handling, subject ordering, and consumption of the complete integrated controller judgment. The existing rule set references this canonical model rather than duplicating its precedence list. The authority now reads the canonical model's evidence precedence.

## Remaining migration boundary

This is an interface-model improvement, not the final runtime-executor cutover. `resourceModelBindingAuthority.ts` still contains outcome classification and fixed-point/cycle control. The next interface-first step should model the full candidate-lattice judgment and closure receipt in the domain algebra, then migrate the executor to evaluate that already-closed contract. Do not move existing functions into a different file and call that an architectural fix.

## Validation

Run `npm run audit:phase1852-resource-binding-integrated-judgment-interface`. This is a static contract audit only. Build, TypeScript typecheck, and E2E are not claimed as passing in this phase.
